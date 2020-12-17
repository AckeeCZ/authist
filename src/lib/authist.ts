import { IncomingMessage, ServerResponse } from 'http';
import { bearer } from './authMiddleware';
import { EmailPasswordProviderOptions, signInWithEmailAndPassword } from './providers/emailPasswordProvider';

export const createAuthenticator = (options: AuthistOptions): Authenticator => ({
    bearer: bearer(options),
    signInWithEmailAndPassword: signInWithEmailAndPassword(options),
});

export interface Authenticator {
    bearer: (request: IncomingMessage, response: ServerResponse) => Promise<any>;
    signInWithEmailAndPassword: (email: string, password: string, req?: IncomingMessage) => Promise<UserCredentials>;
}

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
    emailPassword?: EmailPasswordProviderOptions;
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
