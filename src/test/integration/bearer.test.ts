import express from 'express';
import got from 'got';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { AuthistOptions, createAuthenticator, emailPasswordProvider, ErrorCode, User } from '../../lib';
import { HashingAlgorithm } from '../../lib/providers/emailPasswordProvider';
import { getResetToken } from '../../lib/resetPasswordService';
import { getUserByEmail, getUserById, initDb, updateUser } from '../databaseUtils';

let userModel: any;
let app: Server;
const getAuthenticator = (options: AuthistOptions) => createAuthenticator(options);

describe('Bearer authentication middleware', () => {
    const startServer = (options: AuthistOptions) => {
        const authenticator = getAuthenticator(options);
        const server = express();
        server.get('/', authenticator.expressBearer, (req: any, res) => res.json(req.user));
        server.get('/refresh-token', authenticator.expressRefreshToken);
        app = server.listen(0);
        return `http://0.0.0.0:${(app.address()! as AddressInfo).port}`;
    };
    const getAuthistOptions = (): AuthistOptions => ({
        getUserById: getUserById(userModel),
        emailPassword: {
            getUserByEmail: getUserByEmail(userModel),
            saveNonExistingUser: (data, hashedPassword, _req) =>
                userModel.create({ email: data.email, password: hashedPassword }),
        },
    });
    const email = 'tester@test.com';
    const password = '***';
    beforeAll(async () => {
        userModel = await initDb();
        const user = await emailPasswordProvider.saveNonExistingUser(
            { email, password, request: {} },
            getAuthistOptions()
        );
        expect(user).not.toBeNull();
    });
    afterEach(() => app.close());
    afterAll(() => userModel.dropAllSchemas());
    test('Unauthorized return an error', async () => {
        const serverUrl = startServer(getAuthistOptions());
        try {
            await got(serverUrl, { responseType: 'json' });
        } catch (error) {
            expect(error.response.statusCode).toBe(401);
            return expect(error.response.body.message).toBe(ErrorCode.AuthenticationRequired);
        }
        throw new Error('Expected to throw');
    });
    test('Unsupported type return an error', async () => {
        const serverUrl = startServer(getAuthistOptions());
        try {
            await got(serverUrl, {
                responseType: 'json',
                headers: { authorization: 'basic 123' },
            });
        } catch (error) {
            expect(error.response.statusCode).toBe(401);
            return expect(error.response.body.message).toBe(ErrorCode.UnsupportedAuthorization);
        }
        throw new Error('Expected to throw');
    });
    test('Invalid token return an error', async () => {
        const serverUrl = startServer(getAuthistOptions());
        try {
            await got(serverUrl, {
                responseType: 'json',
                headers: { authorization: 'bearer invalid_token' },
            });
        } catch (error) {
            expect(error.response.statusCode).toBe(401);
            return expect(error.response.body.message).toMatchSnapshot();
        }
        throw new Error('Expected to throw');
    });
    test('Invalid token return custom error', async () => {
        const serverUrl = startServer({
            ...getAuthistOptions(),
            onAuthenticationFailure: () => {
                throw new Error(customError);
            },
        });
        const customError = 'My custom error';
        try {
            await got(serverUrl, {
                responseType: 'json',
                headers: { authorization: 'bearer invalid_token' },
            });
        } catch (error) {
            expect(error.response.statusCode).toBe(401);
            return expect(error.response.body.message).toBe(customError);
        }
        throw new Error('Expected to throw');
    });
    test('Can use onExpressAuthenticationFailure', async () => {
        const serverUrl = startServer({
            ...getAuthistOptions(),
            onAuthenticationFailure: () => {
                throw new Error(customError);
            },
            onExpressAuthenticationFailure: (error, _, res) => {
                res.send(JSON.stringify(error, Object.getOwnPropertyNames(error)));
            },
        });
        const customError = 'My custom error';
        const { body } = await got<{ message: string }>(serverUrl, {
            responseType: 'json',
            headers: { authorization: 'bearer invalid_token' },
        });
        expect(Object.keys(body).sort()).toStrictEqual(['message', 'stack'].sort());
        expect(body.message).toBe(customError);
    });
    test('Can authorize user', async () => {
        const options = getAuthistOptions();
        const serverUrl = startServer(options);
        const { credentials } = await emailPasswordProvider.signInWithEmailAndPassword(options)(email, password);
        const { body } = await got<User & { password?: string }>(serverUrl, {
            responseType: 'json',
            headers: { authorization: `Bearer ${credentials.accessToken}` },
        });
        expect(body.password).toBeUndefined();
        expect(body.email).toBe(email);
        expect(body).toMatchSnapshot();
    });
    test('Can refresh token', async () => {
        const options = getAuthistOptions();
        const serverUrl = startServer(options);
        const { credentials } = await emailPasswordProvider.signInWithEmailAndPassword(options)(email, password);
        const { body } = await got<User & { password?: string }>(`${serverUrl}/refresh-token`, {
            responseType: 'json',
            searchParams: { refreshToken: credentials.refreshToken },
        });
        expect(Object.keys(body).sort()).toStrictEqual(['user', 'credentials'].sort());
    });
    describe('Reset password', () => {
        const startResetPasswordServer = (options: AuthistOptions) => {
            const authenticator = getAuthenticator(options);
            const server = express();
            server.get('/', async (req: any, res) => {
                const data = { ...req.body, ...req.query };
                const credentials = await authenticator.signInWithEmailAndPassword(data.email, data.password, req);
                res.json(credentials);
            });
            server.get('/recover-password', authenticator.expressRecoverPassword);
            server.get('/reset-password', authenticator.expressResetPassword);
            app = server.listen(0);
            return `http://0.0.0.0:${(app.address()! as AddressInfo).port}`;
        };
        afterEach(() => app.close());
        test('User can recover password', async () => {
            const serverUrl = startResetPasswordServer(getRecoverPasswordOptions());
            const { statusCode } = await got<{ token: string }>(`${serverUrl}/recover-password`, {
                searchParams: { email },
                responseType: 'json',
            });
            expect(statusCode).toBe(200);
        });
        test('Non-existing user cannot recover password', async () => {
            try {
                const serverUrl = startResetPasswordServer(getRecoverPasswordOptions());
                await got(`${serverUrl}/recover-password`, {
                    searchParams: { token: 'bad-token' },
                });
                throw new Error('Expected to throw');
            } catch (error) {
                expect(error.response.statusCode).toBe(401);
            }
        });
        test('User can reset password', async () => {
            const options = getResetPasswordOptions();
            const url = startResetPasswordServer(options);
            const psw = 'newPassword';
            const token = await getResetToken(options, { email } as any);
            await got(`${url}/reset-password`, {
                searchParams: { token, password: psw },
            });
            const { body } = await got<{ user: User }>(url, {
                searchParams: { email, password: psw },
                responseType: 'json',
            });
            expect(Object.keys(body).sort()).toStrictEqual(['user', 'credentials'].sort());
            expect(body.user.email).toBe(email);
        });
        test('Non-existing user cannot reset password', async () => {
            try {
                const url = startResetPasswordServer(getResetPasswordOptions());
                await got(`${url}/reset-password`, {
                    searchParams: { password, token: 'bad-token' },
                });
                throw new Error('Expected to throw');
            } catch (error) {
                expect(error.response.statusCode).toBe(400);
            }
        });
    });
});

const getRecoverPasswordOptions = () => ({
    getUserById: getUserById(userModel),
    emailPassword: {
        getUserByEmail: getUserByEmail(userModel),
    },
});

const getResetPasswordOptions = () => ({
    getUserById: getUserById(userModel),
    emailPassword: {
        getUserByEmail: getUserByEmail(userModel),
        passwordHashingAlgorithm: HashingAlgorithm.Plaintext,
        updatePassword: (password: string, user: User) => updateUser(userModel)({ password }, user),
    },
});
