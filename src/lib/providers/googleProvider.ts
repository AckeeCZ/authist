import got from 'got';
import { AuthistOptions, User, UserInfo } from '../authist';
import { createCredentials } from '../credentialsService';
import { ERROR_CODE, NotAuthenticated } from '../error';
import { handleError, sendRegistrationEmail } from '../providerUtils';

export const PEOPLE_BASE_URL = 'https://people.googleapis.com';

interface GoogleField {
    value?: string;
    displayName?: string;
    metadata: {
        primary?: boolean;
    };
}

export interface GoogleUser {
    resourceName: string;
    names: GoogleField[];
    emailAddresses: GoogleField[];
    phoneNumbers: GoogleField[];
}

export interface GoogleSignInOptions {
    getUserByEmail: (email: string, googleUser: any) => Promise<User | undefined>;
    saveNonExistingUser?: (data: UserInfo, googleUser: any) => Promise<User>;
    personFields?: string[];
}

export const signInWithGoogle = (options: AuthistOptions) => async (token: string, req?: any) => {
    try {
        const googleOptions = options.google!;
        const personFields = getFields(googleOptions.personFields);
        const { body } = await got<{ emailAddresses: GoogleField[]; names: any }>(`${PEOPLE_BASE_URL}/v1/people/me`, {
            searchParams: {
                personFields,
                access_token: token,
            },
            responseType: 'json',
        });
        const primaryEmail = getPrimaryField(body.emailAddresses, 'value')!;
        let user = await googleOptions.getUserByEmail(primaryEmail, body);
        if (!user) {
            if (!googleOptions.saveNonExistingUser) {
                throw new NotAuthenticated(ERROR_CODE.UserNotFound);
            }
            user = await saveNonExistingUser({ ...body, primaryEmail }, req, options);
            await sendRegistrationEmail(user, req, options);
        }
        const credentials = createCredentials(user, options);
        return { credentials, user };
    } catch (error) {
        return handleError(error, req, options);
    }
};

export const saveNonExistingUser = async (googleUser: any, req: any, options: AuthistOptions) => {
    try {
        const userInfo = getUserInfo(googleUser);
        await (options.google?.saveNonExistingUser
            ? options.google.saveNonExistingUser(userInfo, googleUser)
            : Promise.resolve({} as User));
        const user = await options.google!.getUserByEmail(googleUser.primaryEmail, googleUser);
        return user!;
    } catch (error) {
        return handleError(error, req, options);
    }
};

const getFields = (fields: string[] = []) => {
    if (!fields?.includes('emailAddresses')) {
        return ['emailAddresses'].concat(fields).join();
    }
    return fields.join();
};

const getPrimaryField = (fields: GoogleField[] = [], key: keyof GoogleField) => {
    const field = fields.find(f => f.metadata.primary);
    const value = field?.[key];
    if (!value) {
        return;
    }
    return String(value);
};

const getUserInfo = (googleUser: any): UserInfo => {
    const { primaryEmail, resourceName, ...gUser } = googleUser;
    return {
        ...gUser,
        email: primaryEmail,
        phoneNumber: getPrimaryField(gUser.phoneNumbers, 'value'),
        displayName: getPrimaryField(gUser.names, 'displayName'),
        providerId: resourceName,
    };
};
