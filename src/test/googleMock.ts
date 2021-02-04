import nock from 'nock';
import { GoogleUser, PEOPLE_BASE_URL } from '../lib/providers/googleProvider';
import { GOOGLE_TOKEN, GOOGLE_USER_EMAIL } from './integration/google.test';

const googleMock = nock(PEOPLE_BASE_URL).persist();

export const getGoogleMock = () =>
    googleMock
        .get('/v1/people/me')
        .query(searchParams => searchParams.access_token === GOOGLE_TOKEN)
        .reply(200, {
            resourceName: 'people/132456789',
            names: [
                {
                    metadata: { primary: true },
                    displayName: 'Larry Page',
                },
            ],
            emailAddresses: [
                {
                    metadata: { primary: true },
                    value: GOOGLE_USER_EMAIL,
                },
            ],
            phoneNumbers: [
                {
                    metadata: { primary: true },
                    value: '123456789',
                },
            ],
        } as GoogleUser)
        .get('/v1/people/me')
        .query(true)
        .reply(200, {
            resourceName: 'people/987654321',
            names: [
                {
                    metadata: { primary: true },
                    displayName: 'Sergey Brin',
                },
            ],
            emailAddresses: [
                {
                    metadata: { primary: true },
                    value: 'non-existing@gmail.com',
                },
            ],
            phoneNumbers: [
                {
                    metadata: { primary: true },
                    value: '987654321',
                },
            ],
        } as GoogleUser);
