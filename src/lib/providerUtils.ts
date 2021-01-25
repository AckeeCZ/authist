import { AuthistOptions, User } from './authist';

export const handleError = (error: Error, request: any, options: AuthistOptions) => {
    if (options.onAuthenticationFailure) {
        options.onAuthenticationFailure(error, request);
    }
    throw error;
};

export const sendRegistrationEmail = async (user: User, request: any, options: AuthistOptions) => {
    try {
        await (options.sendRegistrationEmail ? options.sendRegistrationEmail(user, request) : Promise.resolve());
    } catch (error) {
        return handleError(error, request, options);
    }
};
