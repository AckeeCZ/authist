import { createAuthenticator, ERROR_CODE, User } from '../../lib';
import { initDb } from '../databaseUtils';

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
            getUserById: () => Promise.resolve(undefined),
            emailPassword: {
                getUserByEmail,
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
                getUserByEmail,
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
                getUserByEmail,
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

const getUserByEmail = async (email: string) => {
    const user = await userModel.findOne({ where: { email } });
    if (!user) {
        return;
    }
    const authistUser: User & { password: string } = {
        password: user.password,
        email: user.email,
        providerData: {},
        uid: String(user.id),
    };
    return authistUser;
};
