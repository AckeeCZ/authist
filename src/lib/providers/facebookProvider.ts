import got from 'got';
import { AuthistOptions, User, UserCredentials, UserInfo } from '../authist';
import { createCredentials } from '../credentialsService';
import { ERROR_CODE, NotAuthenticated } from '../error';
import { handleError, sendRegistrationEmail } from '../providerUtils';

export const FACEBOOK_BASE_URL = 'https://graph.facebook.com';

export interface FacebookUser {
    id: string;
    email: string;
    name?: string;
}

export interface FacebookProviderOptions {
    getUserByEmail: (email: string, facebookUser: any) => Promise<User | undefined>;
    graphApiVersion: string;
    fields?: string[];
    saveNonExistingUser?: (data: UserInfo, facebookUser: any) => Promise<User>;
}

export const signInWithFacebook = (options: AuthistOptions) => async (
    token: string,
    req?: any
): Promise<UserCredentials> => {
    try {
        const fbOptions = options.facebook!;
        const fields = getFields(fbOptions.fields);
        const { body } = await got<FacebookUser>(`${FACEBOOK_BASE_URL}/${fbOptions.graphApiVersion}/me`, {
            searchParams: {
                fields,
                access_token: token,
            },
            responseType: 'json',
        });
        let user = await fbOptions.getUserByEmail(body.email, body);
        if (!user) {
            if (!fbOptions.saveNonExistingUser) {
                throw new NotAuthenticated(ERROR_CODE.UserNotFound);
            }
            user = await saveNonExistingUser(body, req, options);
            await sendRegistrationEmail(user, req, options);
        }
        const credentials = createCredentials(user, options);
        return { credentials, user };
    } catch (error) {
        return handleError(error, req, options);
    }
};

const getFields = (fields: string[] = []) => {
    if (!fields?.includes('email')) {
        return ['email'].concat(fields).join();
    }
    return fields.join();
};

export const saveNonExistingUser = async (params: FacebookUser, req: any, options: AuthistOptions) => {
    try {
        const userInfo = getUserInfo(params);
        await (options.facebook?.saveNonExistingUser
            ? options.facebook.saveNonExistingUser(userInfo, params)
            : Promise.resolve({} as User));
        const user = await options.facebook!.getUserByEmail(params.email, params);
        return user!;
    } catch (error) {
        return handleError(error, req, options);
    }
};

const getUserInfo = (params: FacebookUser): UserInfo => {
    const { id, email, name, ...fbUser } = params;
    return {
        ...fbUser,
        email,
        providerId: id,
        displayName: name,
    };
};
