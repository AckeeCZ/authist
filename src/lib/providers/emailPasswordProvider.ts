import { compareSync, hashSync } from 'bcrypt';
import { AuthistOptions, User, UserCredentials, UserInfo } from '../authist';
import { createCredentials } from '../credentialsService';
import { BadRequest, ERROR_CODE, NotAuthenticated } from '../error';
import { handleError, sendRegistrationEmail } from '../providerUtils';

export enum HashingAlgorithm {
    Bcrypt = 'bcrypt',
    Plaintext = 'plaintext',
}

interface SignInParams {
    email: string;
    password: string;
    request: any;
}

interface ValidatePasswordOptions {
    password: string;
    hashedPassword: string;
    request: any;
}

export interface EmailPasswordProviderOptions {
    passwordHashingAlgorithm?: HashingAlgorithm;
    getUserByEmail: (email: string, req: any) => Promise<(User & { password: string }) | undefined>;
    saveNonExistingUser?: (data: UserInfo, hashedPassword: string, req: any) => Promise<User>;
    sendResetPasswordEmail?: (resetToken: string, user: User, req: any) => Promise<void>;
    /** Validate user before the `saveNonExistingUser` function is called */
    validateUser?: (data: UserInfo, password: string, req: any) => Promise<void>;
    /** Do custom sign-in validation steps eg. check number of login attempts etc. */
    validateSignIn?: (email: string, password: string, req: any) => Promise<void>;
    /** Generate custom reset password token */
    getResetPasswordToken?: (user: User) => Promise<string>;
    saveResetPasswordToken?: (token: string, user: User, req?: any) => Promise<void>;
    /** Do custom reset password token validation before the password is changed (before the `updatePassword` function is called) eg. check if the token is expired */
    validateResetPasswordToken?: (token: string, req?: any) => Promise<User | undefined>;
    /** Do custom validation of the changed password before the `updatePassword` function is called eg. is password longer then 8 characters */
    validatePassword?: (password: string, req?: any) => Promise<void>;
    updatePassword?: (hashedPassword: string, user: User, req?: any) => Promise<void>;
    autoRegister?: boolean;
}

export const signInWithEmailAndPassword = (options: AuthistOptions) => async (
    email: string,
    password: string,
    req?: any
): Promise<UserCredentials> => {
    try {
        const emailPasswordOptions = options.emailPassword!;
        let user = await emailPasswordOptions.getUserByEmail(email, req);
        if (!user) {
            if (!emailPasswordOptions.autoRegister || !emailPasswordOptions.saveNonExistingUser) {
                throw new NotAuthenticated(ERROR_CODE.UserNotFound);
            }
            await validateUser({ email, password, request: req }, options);
            user = await saveNonExistingUser({ email, password, request: req }, options);
            await sendRegistrationEmail(user, req, options);
        }
        await validateSignIn({ email, password, request: req }, options);
        await validatePassword({ password, request: req, hashedPassword: user.password }, options);
        const { password: _psw, ...rest } = user;
        const credentials = createCredentials(user, options);
        return { credentials, user: rest };
    } catch (error) {
        return handleError(error, req, options);
    }
};

export const getHashingAlgorithm = (options?: EmailPasswordProviderOptions) => {
    if (options?.passwordHashingAlgorithm) {
        return options.passwordHashingAlgorithm;
    }
    return HashingAlgorithm.Bcrypt;
};

export const validatePassword = async (params: ValidatePasswordOptions, options: AuthistOptions) => {
    try {
        const algorithm = getHashingAlgorithm(options.emailPassword);
        if (algorithm === HashingAlgorithm.Plaintext && params.password !== params.hashedPassword) {
            throw new NotAuthenticated(ERROR_CODE.PasswordMismatch);
        }
        if (algorithm === HashingAlgorithm.Bcrypt && !compareSync(params.password, params.hashedPassword)) {
            throw new NotAuthenticated(ERROR_CODE.PasswordMismatch);
        }
    } catch (error) {
        return handleError(error, params.request, options);
    }
};

export const validateSignIn = async (params: SignInParams, options: AuthistOptions) => {
    try {
        await (options.emailPassword?.validateSignIn
            ? options.emailPassword.validateSignIn(params.email, params.password, params.request)
            : Promise.resolve());
    } catch (error) {
        return handleError(error, params.request, options);
    }
};

export const saveNonExistingUser = async (
    params: SignInParams,
    options: AuthistOptions
): Promise<User & { password: string }> => {
    try {
        const hashedPassword = hashPassword(params.password, options.emailPassword!);
        const userInfo = getUserInfo(params);
        await (options.emailPassword?.saveNonExistingUser
            ? options.emailPassword.saveNonExistingUser(userInfo, hashedPassword, params.request)
            : Promise.resolve({} as User));
        const user = await options.emailPassword?.getUserByEmail(params.email, params.request);
        return user!;
    } catch (error) {
        return handleError(error, params.request, options) as any;
    }
};

export const hashPassword = (password: string, options: EmailPasswordProviderOptions) => {
    const algorithm = getHashingAlgorithm(options);
    if (algorithm === HashingAlgorithm.Bcrypt) {
        return hashSync(password, 12);
    }
    return password;
};

export const validateUser = async (params: SignInParams, options: AuthistOptions) => {
    try {
        const userInfo = getUserInfo(params);
        await (options.emailPassword?.validateUser
            ? options.emailPassword.validateUser(userInfo, params.password, params.request)
            : Promise.resolve());
    } catch (error) {
        return handleError(error, params.request, options);
    }
};

export const createUser = (options: AuthistOptions) => async (data: any, req: any) => {
    try {
        const provider = options.emailPassword!;
        if (!provider.saveNonExistingUser) {
            throw new BadRequest(ERROR_CODE.SaveNonExistingUserNotImplemented);
        }
        const params = { email: data.email, password: data.password, request: req };
        await validateUser(params, options);
        return saveNonExistingUser({ ...data, ...params }, options);
    } catch (error) {
        return handleError(error, req, options);
    }
};

const getUserInfo = (params: SignInParams): UserInfo => ({
    email: params.email,
});
