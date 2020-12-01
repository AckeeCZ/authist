import { NextFunction, Request, Response } from 'express';
import { expressBearer } from './authMiddleware';
import { EmailPasswordProviderOptions, signInWithEmailAndPassword } from './providers/emailPasswordProvider';
import { FacebookProviderOptions, signInWithFacebook } from './providers/facebookProvider';
import { GoogleSignInOptions, signInWithGoogle } from './providers/signInWithGoogle';

export const createAuthenticator = (options: AuthistOptions): Authenticator => ({
    expressBearer: expressBearer(options),
    signInWithEmailAndPassword: signInWithEmailAndPassword(options),
    signInWithFacebook: signInWithFacebook(options),
    signInWithGoogle: signInWithGoogle(options),
});

export interface Authenticator {
    expressBearer: ReturnType<typeof expressBearer>;
    signInWithEmailAndPassword: ReturnType<typeof signInWithEmailAndPassword>;
    signInWithFacebook: ReturnType<typeof signInWithFacebook>;
    signInWithGoogle: ReturnType<typeof signInWithGoogle>;
}

export interface TokenOptions {
    lifetimeMinutes?: number;
    refreshLifetimeMinutes?: number;
    jwtSecret?: string;
    jwtPublicKey?: string;
    jwtPrivateKey?: string;
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
    facebook?: FacebookProviderOptions;
    google?: GoogleSignInOptions;
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
