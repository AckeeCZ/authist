import { signInWithUsernameAndPassword, UsernamePasswordProviderOptions } from './providers/usernamePasswordProvider';

export const createAuthenticator = (options: AuthistOptions) => ({
    signInWithUsernameAndPassword: signInWithUsernameAndPassword(options),
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
