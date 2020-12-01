import { google } from 'googleapis';
import { AuthistOptions, User, UserInfo } from 'lib/authist';

export interface GoogleSignInOptions {
    getUserByEmail: (email: string) => Promise<User | undefined>;
    saveNonExistingUser?: (data: UserInfo, req: any) => Promise<User>;
    validateUser?: (data: UserInfo, req: any) => Promise<void>;
    validateSignIn?: (email: string, req: any) => Promise<void>;
    apiKey: string;
    personFields: string;
}

export const signInWithGoogle = (options: AuthistOptions) => async (token: string) => {
    google.people({ auth: options.google?.apiKey, version: 'v1' }).people.get({
        access_token: token,
        resourceName: 'people/me',
        personFields: options.google?.personFields,
    });
};
