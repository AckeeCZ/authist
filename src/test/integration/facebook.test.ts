import { createAuthenticator, ERROR_CODE } from '../../lib';
import { getUserByEmail, getUserById, initDb } from '../databaseUtils';
import { getFacebookMock } from '../facebookMock';

let userModel: any;

export const FACEBOOK_USER_EMAIL = 'test@facebook.com';
export const GRAPH_API_V9 = 'v9.0';
export const GRAPH_API_V8 = 'v8.0';

describe('FacebookProvider', () => {
    const token = 'my-facebook-token';
    beforeAll(async () => {
        getFacebookMock();
        userModel = await initDb();
    });
    afterAll(async () => {
        await userModel.dropAllSchemas();
    });
    test('Can auto-register user', async () => {
        const authenticator = createAuthenticator({
            getUserById: getUserById(userModel),
            facebook: {
                getUserByEmail: getUserByEmail(userModel),
                graphApiVersion: GRAPH_API_V9,
                saveNonExistingUser: (data, _fbUser) => userModel.create({ email: data.email, password: '' }),
            },
        });
        const { user, credentials } = await authenticator.signInWithFacebook(token);
        expect(user.email).toBe(FACEBOOK_USER_EMAIL);
        expect(Object.keys(user).sort()).toEqual(['password', 'email', 'uid', 'providerData'].sort());
        expect(Object.keys(credentials).sort()).toEqual(
            ['accessToken', 'refreshToken', 'expiresIn', 'refreshExpiresIn'].sort()
        );
    });
    test('User can sign-in', async () => {
        const authenticator = createAuthenticator({
            getUserById: () => Promise.resolve(undefined),
            facebook: {
                getUserByEmail: getUserByEmail(userModel),
                graphApiVersion: GRAPH_API_V9,
            },
        });
        const { user, credentials } = await authenticator.signInWithFacebook(token);
        expect(user.email).toBe(FACEBOOK_USER_EMAIL);
        expect(Object.keys(user).sort()).toEqual(['password', 'email', 'uid', 'providerData'].sort());
        expect(Object.keys(credentials).sort()).toEqual(
            ['accessToken', 'refreshToken', 'expiresIn', 'refreshExpiresIn'].sort()
        );
    });
    test('Non-existing user cannot sign-in', async () => {
        const authenticator = createAuthenticator({
            getUserById: () => Promise.resolve(undefined),
            facebook: {
                graphApiVersion: GRAPH_API_V8,
                getUserByEmail: getUserByEmail(userModel),
            },
        });
        try {
            await authenticator.signInWithFacebook('non-existing-token');
        } catch (error) {
            expect(error.errorCode).toMatch((ERROR_CODE.UserNotFound as any).code);
            return;
        }
        throw Error();
    });
});
