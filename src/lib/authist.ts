import { handleBearer } from './handlers/bearerHandler';
import { handleSignIn } from './handlers/usernamePasswordHandler';
import { signInWithUsernameAndPassword, UsernamePasswordProviderOptions } from './providers/usernamePasswordProvider';

export const createAuthenticator = (options: AuthistOptions) => ({
    signInWithUsernameAndPassword: signInWithUsernameAndPassword(options),
    http: {
        handleUsernameAndPasswordSignIn: handleSignIn(options),
        bearer: handleBearer(options),
    },
});

export interface TokenOptions {
    lifetimeMinutes?: number;
    refreshLifetimeMinutes?: number;
    jwtSecret?: string;
}

export interface User {
    displayName?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    metadata?: UserMetadata;
    phoneNumber?: string;
    photoUrl?: string;
    providerData: UserInfo;
    uid: string;
}

export interface UserInfo {
    email?: string;
    displayName?: string;
    phoneNumber?: string;
    providerId?: string;
    uid?: string;
}

export interface UserMetadata {
    creationTime: Date;
    lastSignInTime: Date;
}

export interface AuthistOptions {
    usernamePassword?: UsernamePasswordProviderOptions;
    onAuthenticationFailure?: (error: Error, req: any) => void;
    sendRegistrationEmail?: (user: User, req: any) => Promise<void>;
    token?: TokenOptions;
    getUserById: (uid: string) => Promise<User | undefined>;
}

export interface UserCredentials {
    user: User;
    credentials: Credentials;
}

export interface Credentials {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
}
