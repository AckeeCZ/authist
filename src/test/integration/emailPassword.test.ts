import { createAuthenticator, ERROR_CODE } from '../../lib';
import { getUserByEmail, getUserById, initDb } from '../databaseUtils';

let userModel: any;

describe('EmailPasswordProvider', () => {
    const email = 'tester@test.com';
    const password = '***';
    beforeAll(async () => {
        userModel = await initDb();
    });
    afterAll(async () => {
        await userModel.dropAllSchemas();
    });
    test('Can auto-register user', async () => {
        const authenticator = createAuthenticator({
            getUserById: getUserById(userModel),
            emailPassword: {
                getUserByEmail: getUserByEmail(userModel),
                saveNonExistingUser: (data, hashedPassword, _req) =>
                    userModel.create({ email: data.email, password: hashedPassword }),
            },
        });
        const { user, credentials } = await authenticator.signInWithEmailAndPassword(email, password);
        expect(user).not.toHaveProperty('password');
        expect(user.email).toBe(email);
        expect(user).toHaveProperty('uid');
        expect(Object.keys(credentials).sort()).toEqual(
            ['accessToken', 'refreshToken', 'expiresIn', 'refreshExpiresIn'].sort()
        );
    });
    test('User can sign-in', async () => {
        const authenticator = createAuthenticator({
            getUserById: () => Promise.resolve(undefined),
            emailPassword: {
                getUserByEmail: getUserByEmail(userModel),
            },
        });
        const { user, credentials } = await authenticator.signInWithEmailAndPassword(email, password);
        expect(user).not.toHaveProperty('password');
        expect(user.email).toBe(email);
        expect(user).toHaveProperty('uid');
        expect(Object.keys(credentials).sort()).toEqual(
            ['accessToken', 'refreshToken', 'expiresIn', 'refreshExpiresIn'].sort()
        );
    });
    test('Non-existing user cannot sign-in', async () => {
        const authenticator = createAuthenticator({
            getUserById: () => Promise.resolve(undefined),
            emailPassword: {
                getUserByEmail: getUserByEmail(userModel),
            },
        });
        try {
            await authenticator.signInWithEmailAndPassword('email', 'password');
        } catch (error) {
            expect(error.errorCode).toMatch((ERROR_CODE.UserNotFound as any).code);
            return;
        }
        throw Error();
    });
});
