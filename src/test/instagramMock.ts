import nock from 'nock';
import { INSTAGRAM_BASE_URL } from '../lib/providers/instagramProvider';
import { INSTAGRAM_USER_EMAIL, INSTAGRAM_V8, INSTAGRAM_V9 } from './integration/instagram.test';

const instagramMock = nock(INSTAGRAM_BASE_URL).persist();

export const getInstagramMock = () =>
    instagramMock
        .get(`/${INSTAGRAM_V9}/me`)
        .query(true)
        .reply(200, {
            id: '132456789',
            email: INSTAGRAM_USER_EMAIL,
        })
        .get(`/${INSTAGRAM_V8}/me`)
        .query(true)
        .reply(200, {
            id: '132456789',
            email: 'non-existing@instagram.com',
        });
