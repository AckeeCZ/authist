import { createAuthenticator, ERROR_CODE } from '../../lib';
import { getUserByEmail, getUserById, initDb } from '../databaseUtils';
import { getGoogleMock } from '../googleMock';

let userModel: any;

export const GOOGLE_USER_EMAIL = 'test@gmail.com';
export const GOOGLE_TOKEN = 'my-google-token';

describe('GoogleProvider', () => {
    beforeAll(async () => {
        getGoogleMock();
        userModel = await initDb();
    });
    afterAll(async () => {
        await userModel.dropAllSchemas();
    });
    test('Can auto-register user', async () => {
        const authenticator = createAuthenticator({
            getUserById: getUserById(userModel),
            google: {
                getUserByEmail: getUserByEmail(userModel),
                saveNonExistingUser: (data, _fbUser) => userModel.create({ email: data.email, password: '' }),
            },
        });
        const { user, credentials } = await authenticator.signInWithGoogle(GOOGLE_TOKEN);
        expect(user.email).toBe(GOOGLE_USER_EMAIL);
        expect(Object.keys(user).sort()).toEqual(['password', 'email', 'uid', 'providerData'].sort());
        expect(Object.keys(credentials).sort()).toEqual(
            ['accessToken', 'refreshToken', 'expiresIn', 'refreshExpiresIn'].sort()
        );
    });
    test('User can sign-in', async () => {
        const authenticator = createAuthenticator({
            getUserById: () => Promise.resolve(undefined),
            google: {
                getUserByEmail: getUserByEmail(userModel),
            },
        });
        const { user, credentials } = await authenticator.signInWithGoogle(GOOGLE_TOKEN);
        expect(user.email).toBe(GOOGLE_USER_EMAIL);
        expect(Object.keys(user).sort()).toEqual(['password', 'email', 'uid', 'providerData'].sort());
        expect(Object.keys(credentials).sort()).toEqual(
            ['accessToken', 'refreshToken', 'expiresIn', 'refreshExpiresIn'].sort()
        );
    });
    test('Non-existing user cannot sign-in', async () => {
        const authenticator = createAuthenticator({
            getUserById: () => Promise.resolve(undefined),
            google: {
                getUserByEmail: getUserByEmail(userModel),
            },
        });
        try {
            await authenticator.signInWithGoogle('non-existing-token');
        } catch (error) {
            expect(error.errorCode).toMatch((ERROR_CODE.UserNotFound as any).code);
            return;
        }
        throw Error();
    });
});
