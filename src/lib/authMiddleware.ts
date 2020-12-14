import { IncomingMessage, ServerResponse } from 'http';
import { AuthistOptions } from './authist';
import { verifyToken } from './credentialsService';
import { ERROR_CODE, NotAuthenticated } from './error';

export const bearer = (options: AuthistOptions) => async (request: IncomingMessage, response: ServerResponse) => {
    const authorization = request.headers.authorization;
    if (!authorization) {
        const error = new NotAuthenticated(ERROR_CODE.AuthenticationRequired);
        response.statusCode = error.status;
        return response.end(error.toJSON());
    }
    const [bearer, accessToken] = authorization.split(' ');
    if (!bearer || bearer.toLowerCase() !== 'bearer') {
        const error = new NotAuthenticated(ERROR_CODE.UnsupportedAuthorization);
        response.statusCode = error.status;
        return response.end(error.toJSON());
    }
    try {
        // @ts-ignore
        request.user = await verifyToken(accessToken, options);
        request.push(null);
    } catch (error) {
        response.statusCode = error.status ?? error.statusCode ?? 401;
        return response.end(error.toJSON ? error.toJSON() : JSON.stringify(error));
    }
};
