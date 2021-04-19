import { Request, Response, Router } from 'express';

import auth, { AuthenticatedBody } from '../middlewares/auth';
import TodoModel from '../model/todo_model';


const TodoRouter = Router();

TodoRouter.post('/todos', auth, async (req: Request, res: Response) => {
    let result: any = null;
    try {
        const { body, authData } = req.body as AuthenticatedBody;
        result = await TodoModel.create({
            ...body,
            owner: authData.user._id!
        });
    } catch (e) {
        result = { error: e.message };
        res.status(400);
    } finally {
        res.send(result);
    }
});

TodoRouter.get('/todos', auth, async (req: Request, res: Response) => {
    let result: any = null;
    try {
        const { authData } = req.body as AuthenticatedBody;
        result = (await authData.user.populate('todos').execPopulate()).todos;
    } catch (e) {
        res.status(500);
    } finally {
        res.send(result);
    }
});

TodoRouter.get('/todos/:todoId', auth, async (req: Request, res: Response) => {
    let result: any = null;
    try {
        const todoId = req.params['todoId']!;
        const { authData } = req.body as AuthenticatedBody;
        result = await TodoModel.findOne({ _id: todoId, owner: authData.user._id });
        if (result === null) {
            res.status(404);
        }
    } catch (e) {
        res.status(500);
    } finally {
        res.send(result);
    }
});

TodoRouter.patch('/todos/:todoId', auth, async (req: Request, res: Response) => {
    let result: any = null;
    try {
        const todoId = req.params['todoId']!;
        const { body, authData } = req.body as AuthenticatedBody;
        result = await TodoModel.findOneAndUpdate({ _id: todoId, owner: authData.user._id }, body, { new: true, runValidators: true });
        if (result === null) {
            res.status(404)
        }
    } catch (e) {
        res.status(500);
    } finally {
        res.send(result);
    }
});

TodoRouter.delete('/todos/:todoId', auth, async (req: Request, res: Response) => {
    let result: any = null;
    try {
        const todoId = req.params['todoId'];
        const { authData } = req.body as AuthenticatedBody;
        result = await TodoModel.findOneAndDelete({ _id: todoId, owner: authData.user._id });
        if (result === null) {
            res.status(404);
        }
    } catch (e) {
        res.status(500);
    } finally {
        res.send(result);
    }
});

export default TodoRouter;
