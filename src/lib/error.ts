export enum ErrorCode {
    PasswordMismatch = 'You entered a wrong password!',
    EmailRequired = 'Email is required field, please enter the email!',
    PasswordRequired = 'Password is required field, please enter the password!',
    UserNotFound = "It seems this user doesn't exist, are you sure you entered correct credentials?",
    AuthenticationRequired = 'You are not authenticated!',
    UnsupportedAuthorization = 'Unsupported authorization type!',
    MissingRefreshToken = 'Refresh token is required parameter! Please send it in body or query as refreshToken.',
    UpdatePasswordNotImplemented = "Function 'updatePassword' is not implemented!" +
        "Please add 'updatePassword' functionality under the 'emailPassword' provider options.",
    ResetPasswordTokenRequired = 'Reset password token is required parameter! Please send it in body or query as token.',
    InvalidResetPasswordToken = 'Reset password token is not valid, some mandatory data are missing!',
}

class GenericError extends Error {
    constructor(
        public readonly message: string,
        public readonly status: number,
        public readonly errorCode: string = ''
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;
    }

    public toJSON() {
        return {
            message: this.message,
            status: this.status,
            errorCode: this.errorCode,
            errorClass: this.constructor.name,
            stack: this.stack,
        };
    }
    static apiErrorData = (error?: typeof ErrorCode[keyof typeof ErrorCode]) => {
        const { message, code } = (error as any) || { message: '', code: '' };
        return [code, message] as [string, string];
    }
}

export class NotAuthenticated extends GenericError {
    constructor(error?: typeof ErrorCode[keyof typeof ErrorCode]) {
        const [code, message] = GenericError.apiErrorData(error);
        super(message, 401, code);
    }
}

const mapErrorCodeValues = (): typeof ErrorCode => {
    const result: any = {};
    const eCode = Object(ErrorCode);
    for (const key in ErrorCode) {
        result[key] = {
            code: key,
            message: eCode[key],
        };
    }
    return result;
};

export const ERROR_CODE = mapErrorCodeValues();
