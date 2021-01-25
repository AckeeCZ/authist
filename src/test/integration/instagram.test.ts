import { createAuthenticator, ERROR_CODE } from '../../lib';
import { getUserByEmail, getUserById, initDb } from '../databaseUtils';
import { getInstagramMock } from '../instagramMock';

let userModel: any;

export const INSTAGRAM_USER_EMAIL = 'test@instagram.com';
export const INSTAGRAM_V9 = 'v9.0';
export const INSTAGRAM_V8 = 'v8.0';

describe('InstagramProvider', () => {
    const token = 'my-instagram-token';
    beforeAll(async () => {
        getInstagramMock();
        userModel = await initDb();
    });
    afterAll(async () => {
        await userModel.dropAllSchemas();
    });
    test('Can auto-register user', async () => {
        const authenticator = createAuthenticator({
            getUserById: getUserById(userModel),
            instagram: {
                getUserByEmail: getUserByEmail(userModel),
                graphApiVersion: INSTAGRAM_V9,
                saveNonExistingUser: (data, _instagramUser) => userModel.create({ email: data.email, password: '' }),
            },
        });
        const { user, credentials } = await authenticator.signInWithInstagram(token);
        expect(user.email).toBe(INSTAGRAM_USER_EMAIL);
        expect(Object.keys(user).sort()).toEqual(['password', 'email', 'uid', 'providerData'].sort());
        expect(Object.keys(credentials).sort()).toEqual(
            ['accessToken', 'refreshToken', 'expiresIn', 'refreshExpiresIn'].sort()
        );
    });
    test('User can sign-in', async () => {
        const authenticator = createAuthenticator({
            getUserById: () => Promise.resolve(undefined),
            instagram: {
                getUserByEmail: getUserByEmail(userModel),
                graphApiVersion: INSTAGRAM_V9,
            },
        });
        const { user, credentials } = await authenticator.signInWithInstagram(token);
        expect(user.email).toBe(INSTAGRAM_USER_EMAIL);
        expect(Object.keys(user).sort()).toEqual(['password', 'email', 'uid', 'providerData'].sort());
        expect(Object.keys(credentials).sort()).toEqual(
            ['accessToken', 'refreshToken', 'expiresIn', 'refreshExpiresIn'].sort()
        );
    });
    test('Non-existing user cannot sign-in', async () => {
        const authenticator = createAuthenticator({
            getUserById: () => Promise.resolve(undefined),
            instagram: {
                graphApiVersion: INSTAGRAM_V8,
                getUserByEmail: getUserByEmail(userModel),
            },
        });
        try {
            await authenticator.signInWithInstagram('non-existing-token');
        } catch (error) {
            expect(error.errorCode).toMatch((ERROR_CODE.UserNotFound as any).code);
            return;
        }
        throw Error();
    });
});
