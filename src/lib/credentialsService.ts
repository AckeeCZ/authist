import { sign, verify } from 'jsonwebtoken';
import { AuthistOptions, Credentials, User } from './authist';
import { ERROR_CODE, NotAuthenticated } from './error';
import { handleError } from './providerUtils';

export const createCredentials = (user: User, options: AuthistOptions): Credentials => {
    const getPayload = (tokenType: string) => ({
        user: {
            uid: user.uid,
        },
        type: tokenType,
    });
    return {
        accessToken: sign(getPayload('accessToken'), getSecret(options), {
            expiresIn: (options.token?.lifetimeMinutes || 60) * 60,
        }),
        refreshToken: sign(getPayload('refreshToken'), getSecret(options), {
            expiresIn: (options.token?.refreshLifetimeMinutes || 60 * 24 * 60) * 60,
        }),
        expiresIn: (options.token?.lifetimeMinutes || 60) * 60,
        refreshExpiresIn: (options.token?.refreshLifetimeMinutes || 60 * 24 * 60) * 60,
    };
};

export const verifyToken = async (token: string, options: AuthistOptions) => {
    try {
        if (!options.getUserById) {
            throw new Error('Function `getUserById` is not implemented!');
        }
        const secret = getSecret(options, true);
        const decodedToken = verify(token, secret) as { user: { uid: string } };
        const { uid } = decodedToken.user;
        const user = await options.getUserById(uid);
        if (!user) {
            throw new NotAuthenticated(ERROR_CODE.UserNotFound);
        }
        return user;
    } catch (error) {
        return handleError(error, {}, options);
    }
};

export const getSecret = (options: AuthistOptions, verify = false) => {
    if (verify && options.token?.jwtPublicKey) {
        return options.token.jwtPublicKey;
    }
    if (options.token?.jwtPrivateKey) {
        return options.token.jwtPrivateKey;
    }
    if (options.token?.jwtSecret) {
        return options.token.jwtSecret;
    }
    console.warn('You should set the JWT secret or private / public keys to prevent security breaches.');
    return 'secret';
};

export const refreshToken = (options: AuthistOptions) => async (refreshToken: string) => {
    const user = await verifyToken(refreshToken, options);
    const credentials = await createCredentials(user, options);
    return { credentials, user };
};
