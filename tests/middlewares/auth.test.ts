import { NextFunction, Request, Response } from 'express';

import auth from '../../src/middlewares/auth';
import { UserDocument } from '../../src/model/user_model';
import DbHelper from '../helpers/db_helper';

beforeEach(async () => {
    await DbHelper.Instance.connect();
    await DbHelper.Instance.cleanUp();
    await DbHelper.Instance.createFixtureUsers();
});

afterEach(async () => {
    await DbHelper.Instance.disconnect();
});

describe('auth', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    const next: NextFunction = jest.fn();

    beforeEach(() => {
        res = {
            send: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });


    describe('when there is no authorization header', () => {
        beforeEach(() => {
            req = {
                header: jest.fn(),
            };
        });

        it('should not call next', async () => {
            await auth(req as Request, res as Response, next);
            expect(next).not.toBeCalled();
        });

        it('should call status on response with 401 code', async () => {
            await auth(req as Request, res as Response, next);
            expect(res.status).toBeCalledWith(401);
        });

        it('should call send on response with error message', async () => {
            await auth(req as Request, res as Response, next);
            expect(res.send).toBeCalledWith({ error: 'Please authenticate' });
        });
    });

    describe('when there is authorization header with incorrect token', () => {
        beforeEach(() => {
            req = {
                header: jest.fn().mockReturnValue('Bearer this-is-token'),
            };
        });

        it('should not call next', async () => {
            await auth(req as Request, res as Response, next);
            expect(next).not.toBeCalled();
        });

        it('should call status on response with 401 code', async () => {
            await auth(req as Request, res as Response, next);
            expect(res.status).toBeCalledWith(401);
        });

        it('should call send on response with error message', async () => {
            await auth(req as Request, res as Response, next);
            expect(res.send).toBeCalledWith({ error: 'Please authenticate' });
        });
    });

    describe('when there is authorization header with correct token', () => {
        const originalBodyValue = 'body';
        let user: UserDocument;
        let token: string;

        beforeEach(async () => {
            user = DbHelper.Instance.fixtureUsers[0]!;
            token = await user.generateAuthToken();
            req = {
                header: jest.fn().mockReturnValue(`Bearer ${token}`),
                body: originalBodyValue,
            };
        });

        it('should call next', async () => {
            await auth(req as Request, res as Response, next);
            expect(next).toBeCalled();
        });

        it('should not call status on response', async () => {
            await auth(req as Request, res as Response, next);
            expect(res.status).not.toBeCalled();
        });

        it('should not call send on response', async () => {
            await auth(req as Request, res as Response, next);
            expect(res.send).not.toBeCalled();
        });

        it('should move body original value into body object under key body', async () => {
            await auth(req as Request, res as Response, next);
            expect(req.body).toMatchObject({ body: originalBodyValue });
        });

        it('should define AuthenticationData to request body', async () => {
            await auth(req as Request, res as Response, next);
            expect(req.body.authData).toBeDefined();
        });

        it('should added AuthenticationData in request body contain token', async () => {
            await auth(req as Request, res as Response, next);
            expect(req.body.authData.token).toBe(token);
        });

        it('should added AuthenticationData in request body contain user', async () => {
            await auth(req as Request, res as Response, next);
            // TODO: Here should be test whether returned user is UserDocument
            expect(req.body.authData.user.toJSON()).toEqual(user.toJSON());
        });
    });
});
