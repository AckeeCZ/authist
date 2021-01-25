import got from 'got';
import { AuthistOptions, User, UserCredentials, UserInfo } from '../authist';
import { createCredentials } from '../credentialsService';
import { ERROR_CODE, NotAuthenticated } from '../error';
import { handleError, sendRegistrationEmail } from '../providerUtils';

export const INSTAGRAM_BASE_URL = 'https://graph.facebook.com';

export interface InstagramUser {
    id: string;
    email: string;
    name?: string;
}

export interface InstagramProviderOptions {
    getUserByEmail: (email: string, instagramUser: any) => Promise<User | undefined>;
    graphApiVersion: string;
    fields?: string[];
    saveNonExistingUser?: (data: UserInfo, instagramUser: any) => Promise<User>;
}

export const signInWithInstagram = (options: AuthistOptions) => async (
    token: string,
    req?: any
): Promise<UserCredentials> => {
    try {
        const instagramOptions = options.instagram!;
        const fields = getFields(instagramOptions.fields);
        const { body } = await got<InstagramUser>(`${INSTAGRAM_BASE_URL}/${instagramOptions.graphApiVersion}/me`, {
            searchParams: {
                fields,
                access_token: token,
            },
            responseType: 'json',
        });
        let user = await instagramOptions.getUserByEmail(body.email, body);
        if (!user) {
            if (!instagramOptions.saveNonExistingUser) {
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

export const saveNonExistingUser = async (params: InstagramUser, req: any, options: AuthistOptions) => {
    try {
        const userInfo = getUserInfo(params);
        await (options.instagram?.saveNonExistingUser
            ? options.instagram.saveNonExistingUser(userInfo, params)
            : Promise.resolve({} as User));
        const user = await options.instagram!.getUserByEmail(params.email, params);
        return user!;
    } catch (error) {
        return handleError(error, req, options);
    }
};

const getUserInfo = (params: InstagramUser): UserInfo => {
    const { id, email, name, ...instaUser } = params;
    return {
        ...instaUser,
        email,
        providerId: id,
        displayName: name,
    };
};
