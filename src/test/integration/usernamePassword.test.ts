import { createAuthenticator, ERROR_CODE, User } from '../../lib';
import { initDb } from '../databaseUtils';

let userModel: any;

describe('UsernamePasswordProvider', () => {
    const username = 'tester';
    const password = '***';
    beforeAll(async () => {
        userModel = await initDb();
    });
    afterAll(async () => {
        await userModel.dropAllSchemas();
    });
    test('Can auto-register user', async () => {
        const authenticator = createAuthenticator({
            getUserById: () => Promise.resolve(undefined),
            usernamePassword: {
                getUserByUsername,
                saveNonExistingUser: (data, hashedPassword, _req) =>
                    userModel.create({ username: data.email, password: hashedPassword }),
            },
        });
        const { user, credentials } = await authenticator.signInWithUsernameAndPassword(username, password);
        expect(user).not.toHaveProperty('password');
        expect(user.email).toBe(username);
        expect(user).toHaveProperty('uid');
        expect(Object.keys(credentials).sort()).toEqual(
            ['accessToken', 'refreshToken', 'expiresIn', 'refreshExpiresIn'].sort()
        );
    });
    test('User can sign-in', async () => {
        const authenticator = createAuthenticator({
            getUserById: () => Promise.resolve(undefined),
            usernamePassword: {
                getUserByUsername,
            },
        });
        const { user, credentials } = await authenticator.signInWithUsernameAndPassword(username, password);
        expect(user).not.toHaveProperty('password');
        expect(user.email).toBe(username);
        expect(user).toHaveProperty('uid');
        expect(Object.keys(credentials).sort()).toEqual(
            ['accessToken', 'refreshToken', 'expiresIn', 'refreshExpiresIn'].sort()
        );
    });
    test('Non-existing user cannot sign-in', async () => {
        const authenticator = createAuthenticator({
            getUserById: () => Promise.resolve(undefined),
            usernamePassword: {
                getUserByUsername,
            },
        });
        try {
            await authenticator.signInWithUsernameAndPassword('username', 'password');
        } catch (error) {
            expect(error.errorCode).toMatch((ERROR_CODE.UserNotFound as any).code);
            return;
        }
        throw Error();
    });
});

const getUserByUsername = async (username: string) => {
    const user = await userModel.findOne({ where: { username } });
    if (!user) {
        return;
    }
    const authistUser: User & { password: string } = {
        password: user.password,
        email: user.username,
        providerData: {},
        uid: String(user.id),
    };
    return authistUser;
};
