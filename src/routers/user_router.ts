import { Request, Response, Router } from 'express';

import auth, { AuthenticatedBody } from '../middlewares/auth';
import UserModel from '../model/user_model';


const UserRouter = Router();

UserRouter.post('/users', async (req: Request, res: Response) => {
    let result: any = null;
    try {
        const user = await UserModel.create(req.body);
        const token = await user.generateAuthToken();
        result = {
            user,
            token
        };
    } catch (e) {
        result = { error: e.message };
        res.status(400);
    } finally {
        res.send(result);
    }
});

UserRouter.post('/users/login', async (req: Request, res: Response) => {
    let result: any = null
    try {
        const user = await UserModel.findByCredentials(req.body['email'], req.body['password']);
        if (user === null) {
            res.status(400)
        } else {
            const token = await user!.generateAuthToken();
            result = {
                user,
                token
            };
        }
    } catch (e) {
        res.status(400);
    } finally {
        res.send(result);
    }
});

UserRouter.post('/users/logout', auth, async (req: Request, res: Response) => {
    let result: any = null;
    try {
        const { authData } = req.body as AuthenticatedBody;
        await authData.user.removeAuthToken(authData.token);
    } catch (e) {
        res.status(500);
    } finally {
        res.send(result);
    }
});

UserRouter.post('/users/logoutAll', auth, async (req: Request, res: Response) => {
    let result: any = null;
    try {
        const { authData } = req.body as AuthenticatedBody;
        await authData.user.removeAllAuthTokens();
    } catch (e) {
        res.status(500);
    } finally {
        res.send(result);
    }
});

UserRouter.get('/users/me', auth, async (req: Request, res: Response) => {
    let result: any = null;
    try {
        const { authData } = req.body as AuthenticatedBody;
        result = authData.user;
    } catch (e) {
        res.status(500);
    } finally {
        res.send(result);
    }
});

UserRouter.patch('/users/me', auth, async (req: Request, res: Response) => {
    let result: any = null;
    try {
        const { body, authData } = req.body as AuthenticatedBody;
        authData.user.set(body);
        await authData.user.save();
        result = authData.user;
    } catch (e) {
        res.status(500);
    } finally {
        res.send(result);
    }
});

UserRouter.delete('/users/me', auth, async (req: Request, res: Response) => {
    let result: any = null;
    try {
        const { authData } = req.body as AuthenticatedBody;
        await authData.user.delete();
        result = authData.user;
    } catch (e) {
        res.status(500);
    } finally {
        res.send(result);
    }
});

export default UserRouter;
