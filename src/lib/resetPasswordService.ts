import { sign, verify } from 'jsonwebtoken';
import { AuthistOptions, User } from './authist';
import { getSecret } from './credentialsService';
import { ERROR_CODE, NotAuthenticated } from './error';
import { hashPassword } from './providers/emailPasswordProvider';
import { handleError } from './providerUtils';

const RESET_TOKEN_TYPE = 'resetPasswordToken';

export const resetPassword = (options: AuthistOptions) => async (email: string, req?: any) => {
    try {
        const opts = options.emailPassword!;
        const user = await opts.getUserByEmail(email, req);
        if (!user) {
            throw new NotAuthenticated(ERROR_CODE.UserNotFound);
        }
        const token = await getResetToken(options, user);
        await (opts?.sendResetPasswordEmail ? opts.sendResetPasswordEmail(token, user, req) : Promise.resolve());
        await (opts.saveResetPasswordToken ? opts.saveResetPasswordToken(token, user, req) : Promise.resolve());
        return { token };
    } catch (error) {
        return handleError(error, req, options);
    }
};

export const changePassword = (options: AuthistOptions) => async (token: string, password: string, req?: any) => {
    try {
        const opts = options.emailPassword!;
        if (!opts.updatePassword) {
            throw new NotAuthenticated(ERROR_CODE.UpdatePasswordNotImplemented);
        }
        const user = await validateResetToken(token, options, req);
        if (!user) {
            throw new NotAuthenticated(ERROR_CODE.UserNotFound);
        }
        await (opts.validatePassword ? opts.validatePassword(password, req) : Promise.resolve());
        const hashedPassword = hashPassword(password, opts);
        await (opts.updatePassword ? opts.updatePassword(hashedPassword, user, req) : Promise.resolve());
    } catch (error) {
        return handleError(error, req, options);
    }
};

const validateResetToken = async (token: string, options: AuthistOptions, req?: any) => {
    try {
        if (options.emailPassword?.validateResetPasswordToken) {
            return await options.emailPassword.validateResetPasswordToken(token, req);
        }
        const secret = getSecret(options, true);
        const decodedToken = verify(token, secret) as { email: string; type: string };
        if (decodedToken.type !== RESET_TOKEN_TYPE) {
            throw new NotAuthenticated(ERROR_CODE.InvalidResetPasswordTokenType);
        }
        if (!decodedToken.email) {
            throw new NotAuthenticated(ERROR_CODE.InvalidResetPasswordToken);
        }
        return options.emailPassword!.getUserByEmail(decodedToken.email, req);
    } catch (error) {
        return handleError(error, req, options);
    }
};

export const getResetToken = async (options: AuthistOptions, user: User) => {
    if (!options!.emailPassword?.getResetPasswordToken) {
        return sign({ type: RESET_TOKEN_TYPE, email: user.email }, getSecret(options), {
            expiresIn: (options.token?.lifetimeMinutes || 60) * 60,
        });
    }
    return options!.emailPassword!.getResetPasswordToken!(user);
};
