import { RequestListener } from 'http';
import { parse } from 'querystring';
import { parse as parseUrl } from 'url';
import { AuthistOptions } from '../authist';
import { ERROR_CODE, NotAuthenticated } from '../error';
import { signInWithUsernameAndPassword } from '../providers/usernamePasswordProvider';

export const handleSignIn = (options: AuthistOptions): RequestListener => (request, response) => {
    const query = (parseUrl(request.url || '', true).query as object) || {};
    let body = '';
    request.on('data', (chunk) => {
        body += chunk.toString();
    });
    request.on('end', async () => {
        try {
            const data: any = { ...parse(body), ...query };
            if (!data.username) {
                throw new NotAuthenticated(ERROR_CODE.UsernameRequired);
            }
            if (!data.password) {
                throw new NotAuthenticated(ERROR_CODE.PasswordRequired);
            }
            const credentials = await signInWithUsernameAndPassword(options)(data.username, data.password, request);
            response.statusCode = 200;
            response.end(JSON.stringify(credentials));
        } catch (error) {
            response.statusCode = error.status || 500;
            response.end(JSON.stringify(error));
        }
    });
};
