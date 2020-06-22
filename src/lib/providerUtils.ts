import { AuthistOptions } from './authist';

export const handleError = (error: Error, request: any, options: AuthistOptions) => {
    if (options.onAuthenticationFailure) {
        options.onAuthenticationFailure(error, request);
    }
    throw error;
};
