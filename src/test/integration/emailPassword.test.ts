import { createAuthenticator, ERROR_CODE, User } from '../../lib';
import { HashingAlgorithm } from '../../lib/providers/emailPasswordProvider';
import { getResetToken } from '../../lib/resetPasswordService';
import { getUserByEmail, getUserById, initDb, updateUser } from '../databaseUtils';

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
    describe('Reset password', () => {
        test('User can reset password', async () => {
            const password = 'myNewStrongPassword';
            const authenticator = getResetPasswordAuthenticator();
            const options = getResetPasswordOptions();
            const resetToken = await getResetToken(options, { email } as any);
            await authenticator.resetPassword(resetToken, password);
            const credentials = await authenticator.signInWithEmailAndPassword(email, password);
            expect(Object.keys(credentials).sort()).toStrictEqual(['credentials', 'user'].sort());
        });
        test('Non-existing user cannot reset password', async () => {
            const authenticator = getResetPasswordAuthenticator();
            try {
                const options = getResetPasswordOptions();
                const token = await getResetToken(options, { email: 'bad@user.app' } as any);
                await authenticator.resetPassword(token, 'newPassword');
                throw new Error('Expected to throw');
            } catch (error) {
                expect(error.message).toMatch((ERROR_CODE.InvalidResetPasswordToken as any).message);
            }
        });
        test("Reset password does not work when it's not implemented", async () => {
            const authenticator = createAuthenticator({
                getUserById: getUserById(userModel),
                emailPassword: {
                    getUserByEmail: getUserByEmail(userModel),
                    passwordHashingAlgorithm: HashingAlgorithm.Plaintext,
                },
            });
            const auth = createAuthenticator({
                getUserById: getUserById(userModel),
                emailPassword: {
                    getUserByEmail: getUserByEmail(userModel),
                    passwordHashingAlgorithm: HashingAlgorithm.Plaintext,
                    updatePassword: (password, user) => updateUser(userModel)({ password }, user),
                },
            });
            try {
                await authenticator.resetPassword('token', password);
                throw new Error('Expected to throw');
            } catch (error) {
                expect(error.message).toBe((ERROR_CODE.UpdatePasswordNotImplemented as any).message);
            }
            try {
                await auth.resetPassword('token', password);
                throw new Error('Expected to throw');
            } catch (error) {
                expect(error.message).toMatch(/jwt malformed/);
            }
        });
    });
});

const getResetPasswordAuthenticator = () => createAuthenticator(getResetPasswordOptions());

const getResetPasswordOptions = () => ({
    getUserById: getUserById(userModel),
    emailPassword: {
        getUserByEmail: getUserByEmail(userModel),
        passwordHashingAlgorithm: HashingAlgorithm.Plaintext,
        updatePassword: (password: string, user: User) => updateUser(userModel)({ password }, user),
    },
});
