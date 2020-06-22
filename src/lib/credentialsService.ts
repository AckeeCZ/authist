import { sign, verify } from 'jsonwebtoken';
import { AuthistOptions, Credentials, User } from './authist';
import { handleError } from './providerUtils';

export const createCredentials = (user: User, options: AuthistOptions): Credentials => ({
    accessToken: sign({ uid: user.uid }, getSecret(options), {
        expiresIn: (options.token?.lifetimeMinutes || 60) * 60,
    }),
    // todo
    refreshToken: sign({ uid: user.uid }, getSecret(options), {
        expiresIn: (options.token?.lifetimeMinutes || 60) * 60,
    }),
    expiresIn: (options.token?.lifetimeMinutes || 60) * 60,
    // todo
    refreshExpiresIn: (options.token?.refreshLifetimeMinutes || 60) * 60,
});

export const verifyToken = (token: string, options: AuthistOptions) => {
    try {
        const secret = getSecret(options);
        return verify(token, secret);
    } catch (error) {
        return handleError(error, {}, options);
    }
};

const getSecret = (options: AuthistOptions) => {
    if (options.token?.jwtSecret) {
        return options.token.jwtSecret;
    }
    return 'secret';
};
