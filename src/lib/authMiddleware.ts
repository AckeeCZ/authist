import { NextFunction, Request, Response } from 'express';
import { AuthistOptions, Credentials, User } from './authist';
import { refreshToken as refreshUserToken, verifyToken } from './credentialsService';
import { ERROR_CODE, NotAuthenticated } from './error';

export type BearerError = Error & { status?: number; statusCode?: number; toJSON?: any };

export const bearer = async (
    options: AuthistOptions,
    authorization?: string
): Promise<[BearerError | undefined, User | undefined]> => {
    if (!authorization) {
        return [new NotAuthenticated(ERROR_CODE.AuthenticationRequired), undefined];
    }
    const [bearer, accessToken] = authorization.split(' ');
    if (!bearer || bearer.toLowerCase() !== 'bearer') {
        return [new NotAuthenticated(ERROR_CODE.UnsupportedAuthorization), undefined];
    }
    try {
        const user = await verifyToken(accessToken, options);
        return [undefined, user];
    } catch (error) {
        return [error, undefined];
    }
};

const refreshToken = async (
    options: AuthistOptions,
    refreshToken?: string
): Promise<[BearerError | undefined, { credentials: Credentials; user: User } | undefined]> => {
    if (!refreshToken) {
        return [new NotAuthenticated(ERROR_CODE.MissingRefreshToken), undefined];
    }
    try {
        const credentials = await refreshUserToken(options)(refreshToken);
        return [undefined, credentials];
    } catch (error) {
        return [error, undefined];
    }
};

export const expressBearer = (options: AuthistOptions) => async (
    request: Request & { user?: User },
    response: Response,
    next: NextFunction
) => {
    const [error, user] = await bearer(options, request.headers.authorization);
    if (error) {
        if (options.onExpressAuthenticationFailure) {
            return options.onExpressAuthenticationFailure(error, request, response, next);
        }
        response.statusCode = error.status ?? error.statusCode ?? 401;
        return response.json({ message: error?.message });
    }
    request.user = user;
    next();
};

export const expressRefreshToken = (options: AuthistOptions) => async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const [error, credentials] = await refreshToken(options, request.body?.refreshToken ?? request.query.refreshToken);
    if (error) {
        if (options.onExpressAuthenticationFailure) {
            return options.onExpressAuthenticationFailure(error, request, response, next);
        }
        response.statusCode = error.status ?? error.statusCode ?? 401;
        return response.json({ message: error?.message });
    }
    return response.json(credentials);
};
