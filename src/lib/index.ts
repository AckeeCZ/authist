export {
    Authenticator,
    AuthistOptions,
    Credentials,
    createAuthenticator,
    TokenOptions,
    User,
    UserCredentials,
    UserInfo,
    UserMetadata,
} from './authist';
export { ERROR_CODE, ErrorCode, NotAuthenticated } from './error';
export { BearerError, bearer, expressBearer, expressChangePassword, expressResetPassword } from './authMiddleware';
export { verifyToken, createCredentials } from './credentialsService';
export * as emailPasswordProvider from './providers/emailPasswordProvider';
export * as facebookProvider from './providers/facebookProvider';
export * as googleProvider from './providers/googleProvider';
export * as resetPasswordService from './resetPasswordService';
