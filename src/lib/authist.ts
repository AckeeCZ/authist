import { NextFunction, Request, Response } from 'express';
import { IncomingMessage } from 'http';
import { expressBearer } from './authMiddleware';
import { EmailPasswordProviderOptions, signInWithEmailAndPassword } from './providers/emailPasswordProvider';

export const createAuthenticator = (options: AuthistOptions): Authenticator => ({
    expressBearer: expressBearer(options),
    signInWithEmailAndPassword: signInWithEmailAndPassword(options),
});

export interface Authenticator {
    expressBearer: (request: Request, response: Response, next: NextFunction) => Promise<any>;
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
    onExpressAuthenticationFailure?: (error: Error, req: Request, res: Response, next: NextFunction) => void;
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
