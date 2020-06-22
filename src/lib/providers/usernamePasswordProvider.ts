import { compareSync, hashSync } from 'bcrypt';
import { RequestHandler } from 'express';
import { AuthistOptions, User, UserCredentials, UserInfo } from '../authist';
import { createCredentials } from '../credentialsService';
import { ERROR_CODE, NotAuthenticated } from '../error';
import { handleError } from '../providerUtils';

export enum HashingAlgorithm {
    Bcrypt = 'bcrypt',
    Plaintext = 'plaintext',
}

interface SignInParams {
    username: string;
    password: string;
    request: any;
}

interface ValidatePasswordOptions {
    password: string;
    hashedPassword: string;
    request: any;
}

export interface UsernamePasswordProviderOptions {
    passwordHashingAlgorithm?: HashingAlgorithm;
    getUserByUsername: (username: string, req: any) => Promise<(User & { password: string }) | undefined>;
    saveNonExistingUser?: (data: UserInfo, hashedPassword: string, req: any) => Promise<User>;
    sendResetPasswordEmail?: (user: User, req: any) => Promise<void>;
    validateUser?: (data: UserInfo, password: string, req: any) => Promise<void>;
    validateSignIn?: (username: string, password: string, req: any) => Promise<void>;
}

export const usernamePassword = (options: AuthistOptions): RequestHandler => async (req, res, next) => {
    const data = { ...req.body, ...req.query };
    try {
        if (!data.username) {
            throw new NotAuthenticated(ERROR_CODE.UsernameRequired);
        }
        if (!data.password) {
            throw new NotAuthenticated(ERROR_CODE.PasswordRequired);
        }
        const credentials = await signInWithUsernameAndPassword(options)(data.username, data.password, req);
        res.status(200);
        res.json(credentials);
    } catch (error) {
        next(error);
    }
};

export const signInWithUsernameAndPassword = (options: AuthistOptions) => async (
    username: string,
    password: string,
    req?: any
): Promise<UserCredentials> => {
    try {
        const usernamePasswordOptions = options.usernamePassword!;
        let user = await usernamePasswordOptions.getUserByUsername(username, req);
        if (!user) {
            if (!usernamePasswordOptions.saveNonExistingUser) {
                throw new NotAuthenticated(ERROR_CODE.UserNotFound);
            }
            await validateUser({ username, password, request: req }, options);
            user = await saveNonExistingUser({ username, password, request: req }, options);
            await sendRegistrationEmail(user, req, options);
        }
        await validateSignIn({ username, password, request: req }, options);
        await validatePassword({ password, request: req, hashedPassword: user.password }, options);
        const { password: _psw, ...rest } = user;
        const credentials = createCredentials(user, options);
        return { credentials, user: rest };
    } catch (error) {
        return handleError(error, req, options);
    }
};

export const getHashingAlgorithm = (options?: UsernamePasswordProviderOptions) => {
    if (options?.passwordHashingAlgorithm) {
        return options.passwordHashingAlgorithm;
    }
    return HashingAlgorithm.Bcrypt;
};

export const validatePassword = async (params: ValidatePasswordOptions, options: AuthistOptions) => {
    try {
        const algorithm = getHashingAlgorithm(options.usernamePassword);
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
        await (options.usernamePassword?.validateSignIn
            ? options.usernamePassword.validateSignIn(params.username, params.password, params.request)
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
        const hashedPassword = hashPassword(params.password, options.usernamePassword!);
        const userInfo = getUserInfo(params);
        await (options.usernamePassword?.saveNonExistingUser
            ? options.usernamePassword.saveNonExistingUser(userInfo, hashedPassword, params.request)
            : Promise.resolve({} as User));
        const user = await options.usernamePassword?.getUserByUsername(params.username, params.request);
        return user!;
    } catch (error) {
        return handleError(error, params.request, options) as any;
    }
};

const hashPassword = (password: string, options: UsernamePasswordProviderOptions) => {
    const algorithm = getHashingAlgorithm(options);
    if (algorithm === HashingAlgorithm.Bcrypt) {
        return hashSync(password, 12);
    }
    return password;
};

export const validateUser = async (params: SignInParams, options: AuthistOptions) => {
    try {
        const userInfo = getUserInfo(params);
        await (options.usernamePassword?.validateUser
            ? options.usernamePassword.validateUser(userInfo, params.password, params.request)
            : Promise.resolve());
    } catch (error) {
        return handleError(error, params.request, options);
    }
};

const getUserInfo = (params: SignInParams): UserInfo => ({
    email: params.username,
});
