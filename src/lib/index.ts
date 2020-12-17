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
export { BearerError, bearer, expressBearer } from './authMiddleware';
export { verifyToken, createCredentials } from './credentialsService';
export {
    EmailPasswordProviderOptions,
    getHashingAlgorithm,
    HashingAlgorithm,
    saveNonExistingUser,
    sendRegistrationEmail,
    signInWithEmailAndPassword,
    validatePassword,
    validateSignIn,
    validateUser,
} from './providers/emailPasswordProvider';
