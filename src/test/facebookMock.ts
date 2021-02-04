import nock from 'nock';
import { FACEBOOK_BASE_URL } from '../lib/providers/facebookProvider';
import { FACEBOOK_USER_EMAIL, GRAPH_API_V8, GRAPH_API_V9 } from './integration/facebook.test';

const facebookMock = nock(FACEBOOK_BASE_URL).persist();

export const getFacebookMock = () =>
    facebookMock
        .get(`/${GRAPH_API_V9}/me`)
        .query(true)
        .reply(200, {
            id: '132456789',
            email: FACEBOOK_USER_EMAIL,
        })
        .get(`/${GRAPH_API_V8}/me`)
        .query(true)
        .reply(200, {
            id: '132456789',
            email: 'non-existing@facebook.com',
        });
