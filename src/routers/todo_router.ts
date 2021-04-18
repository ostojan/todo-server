import { Request, Response, Router } from 'express';

import auth, { AuthenticatedBody } from '../middlewares/auth';
import TodoModel from '../model/todo_model';


const TodoRouter = Router();

TodoRouter.post('/todos', auth, async (req: Request, res: Response) => {
    try {
        const { body, authData } = req.body as AuthenticatedBody;
        const todo = await TodoModel.create({
            ...body,
            owner: authData.user._id!
        })
        res.send(todo.toJSON());
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

TodoRouter.get('/todos', auth, async (req: Request, res: Response) => {
    const { authData } = req.body as AuthenticatedBody;
    await authData.user.populate('todos').execPopulate();
    res.send(authData.user.todos);
});

TodoRouter.get('/todos/:todoId', auth, async (req: Request, res: Response) => {
    try {
        const todoId = req.params['todoId']!;
        const { authData } = req.body as AuthenticatedBody;
        const todo = await TodoModel.findOne({ _id: todoId, owner: authData.user._id });
        if (todo === null) {
            res.status(404).send();
        } else {
            res.send(todo);
        }
    } catch (e) {
        res.status(500).send();
    }
});

TodoRouter.patch('/todos/:todoId', auth, async (req: Request, res: Response) => {
    try {
        const todoId = req.params['todoId']!;
        const { body, authData } = req.body as AuthenticatedBody;
        const todo = await TodoModel.findById({ _id: todoId, owner: authData.user._id });
        if (todo === null) {
            return res.status(404).send();
        }
        const updates = Object.keys(body);
        const allowedUpdates = ['title', 'date', 'completed'];
        const isValidOperation = updates.every((update: string) => allowedUpdates.includes(update));
        if (!isValidOperation) {
            return res.status(400).send({ error: 'Invalid updates' });
        }
        updates.forEach((key: string) => {
            todo.set(key, body[key]);
        });
        await todo.save();
        return res.send(todo);
    } catch (e) {
        return res.status(500).send();
    }
});

TodoRouter.delete('/todos/:todoId', auth, async (req: Request, res: Response) => {
    try {
        const todoId = req.params['todoId'];
        const { authData } = req.body as AuthenticatedBody;
        const deletedTodo = await TodoModel.findOneAndDelete({ _id: todoId, owner: authData.user._id });
        if (deletedTodo === null) {
            res.status(404).send();
        } else {
            res.send(deletedTodo);
        }
    } catch (e) {
        res.status(500).send();
    }
});

export default TodoRouter;
