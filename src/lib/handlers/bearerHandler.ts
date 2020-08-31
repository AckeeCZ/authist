import { RequestListener } from 'http';
import { AuthistOptions } from '../authist';
import { verifyToken } from '../credentialsService';
import { ERROR_CODE, NotAuthenticated } from '../error';

export const handleBearer = (options: AuthistOptions): RequestListener => async (request, response) => {
    try {
        const authorization = request.headers.authorization;
        if (!authorization) {
            throw new NotAuthenticated(ERROR_CODE.AuthorizationHeaderEmpty);
        }
        const [bearer, token] = authorization.split(' ');
        if (!bearer || bearer.toLowerCase() !== 'bearer') {
            throw new NotAuthenticated(ERROR_CODE.NotBearerToken);
        }
        // @ts-ignore
        request.user = await verifyToken(token || '', {
            ...options,
            onAuthenticationFailure: undefined,
        });
    } catch (error) {
        response.statusCode = 401;
        response.end(JSON.stringify(error));
    }
};
