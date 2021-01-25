import express from 'express';
import got from 'got';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { AuthistOptions, createAuthenticator, emailPasswordProvider, ErrorCode, User } from '../../lib';
import { getUserByEmail, getUserById, initDb } from '../databaseUtils';

let userModel: any;
let app: Server;
const getAuthenticator = (options: AuthistOptions) => createAuthenticator(options);

describe('Bearer authentication middleware', () => {
    const startServer = (options: AuthistOptions) => {
        const authenticator = getAuthenticator(options);
        const server = express();
        server.get('/', authenticator.expressBearer, (req: any, res) => res.json(req.user));
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
});
