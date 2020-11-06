import { compareSync, hashSync } from 'bcrypt';
import { AuthistOptions, User, UserCredentials, UserInfo } from '../authist';
import { createCredentials } from '../credentialsService';
import { ERROR_CODE, NotAuthenticated } from '../error';
import { handleError } from '../providerUtils';

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
    sendResetPasswordEmail?: (user: User, req: any) => Promise<void>;
    validateUser?: (data: UserInfo, password: string, req: any) => Promise<void>;
    validateSignIn?: (email: string, password: string, req: any) => Promise<void>;
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
            if (!emailPasswordOptions.saveNonExistingUser) {
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

export const sendRegistrationEmail = async (user: User, request: any, options: AuthistOptions) => {
    try {
        await (options.sendRegistrationEmail ? options.sendRegistrationEmail(user, request) : Promise.resolve());
    } catch (error) {
        return handleError(error, request, options);
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

const hashPassword = (password: string, options: EmailPasswordProviderOptions) => {
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

const getUserInfo = (params: SignInParams): UserInfo => ({
    email: params.email,
});
