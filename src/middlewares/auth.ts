import { NextFunction, Request, Response } from 'express';

import UserModel, { UserDocument } from '../model/user_model';

export interface AuthenticationData {
    token: string,
    user: UserDocument
};

export interface AuthenticatedBody {
    body: any,
    authData: AuthenticationData
};

const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.header('Authorization')
        ?.replace('Bearer', '')
        .trim()!;
    const user = await UserModel.findByToken(token);
    if (user === null) {
        res.status(401).send({ error: 'Please authenticate' });
    } else {
        req.body = {
            body: req.body,
            authData: {
                token,
                user
            }
        };
        next();
    }
};

export default auth;
