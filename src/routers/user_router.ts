import { Request, Response, Router } from 'express';

import auth, { AuthenticatedBody } from '../middlewares/auth';
import UserModel from '../model/user_model';


const UserRouter = Router();

UserRouter.post('/users', async (req: Request, res: Response) => {
    try {
        const user = await UserModel.create(req.body);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

UserRouter.post('/users/login', async (req: Request, res: Response) => {
    try {
        // TODO: This sould be handled in findByCredentials
        //       to avoid using exceptions as control flow
        const user = await UserModel.findByCredentials(req.body['email'], req.body['password']);
        if (user === null) {
            throw new Error();
        }
        const token = await user!.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send();
    }
});

UserRouter.post('/users/logout', auth, async (req: Request, res: Response) => {
    try {
        const { authData } = req.body as AuthenticatedBody;
        await authData.user.removeAuthToken(authData.token);
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

UserRouter.post('/users/logoutAll', auth, async (req: Request, res: Response) => {
    try {
        const { authData } = req.body as AuthenticatedBody;
        await authData.user.removeAllAuthTokens();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

UserRouter.get('/users/me', auth, async (req: Request, res: Response) => {
    try {
        const { authData } = req.body as AuthenticatedBody;
        res.send(authData.user.toJSON());
    } catch (e) {
        res.status(500).send();
    }
});

UserRouter.patch('/users/me', auth, async (req: Request, res: Response) => {
    try {
        const { body, authData } = req.body as AuthenticatedBody;
        const updates = Object.keys(body);
        const allowedUpdates = ['email', 'password'];
        const isValidOperation = updates.every((update: string) => allowedUpdates.includes(update));
        if (!isValidOperation) {
            res.status(400).send({ error: 'Invalid updates' });
        } else {
            const user = authData.user;
            updates.forEach((key: string) => {
                user.set(key, body[key]);
            });
            await user.save();
            res.send(user.toJSON());
        }
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

UserRouter.delete('/users/me', auth, async (req: Request, res: Response) => {
    try {
        const { authData } = req.body as AuthenticatedBody;
        await authData.user.delete();
        res.send(authData.user);
    } catch (e) {
        res.status(500).send();
    }
});

export default UserRouter;
