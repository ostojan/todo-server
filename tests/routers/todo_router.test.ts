import { Types } from 'mongoose';
import request from 'supertest';

import App from '../../src/app';
import TodoModel, { TodoDocument } from '../../src/model/todo_model';
import { UserDocument } from '../../src/model/user_model';
import DbHelper from '../helpers/db_helper';

const PORT = parseInt(process.env['PORT']!);
const app = new App(PORT);

beforeEach(async () => {
    await DbHelper.Instance.connect();
    await DbHelper.Instance.cleanUp();
    await DbHelper.Instance.createFixtureUsers();
});

afterEach(async () => {
    await DbHelper.Instance.disconnect();
});

describe('TodoRouter', () => {
    describe('POST /todos', () => {
        const properTodoDataWithoutDate = {
            title: 'Todo 1',
            completed: false
        };
        const properTodoDataWithDate = {
            ...properTodoDataWithoutDate,
            date: Date.now(),
        }
        const path = '/todos';
        let authorizationHeader: string;

        beforeEach(async () => {
            const user = DbHelper.Instance.fixtureUsers[0]!;
            const token = await user.generateAuthToken();
            authorizationHeader = `Bearer ${token}`;
        });

        it('should return 401 when user is not authenticated', async () => {
            await request(app.app)
                .post(path)
                .send()
                .expect(401);
        });

        it('should return 200 when user is authenticated', async () => {
            await request(app.app)
                .post(path)
                .set('Authorization', authorizationHeader)
                .send(properTodoDataWithoutDate)
                .expect(200);
        });

        it('should return 400 when sent data without title', async () => {
            const todoDataWithoutTitle = {
                completed: properTodoDataWithoutDate.completed
            };
            await request(app.app)
                .post(path)
                .set('Authorization', authorizationHeader)
                .send(todoDataWithoutTitle)
                .expect(400);
        });

        it('should return 400 when sent data without completed status', async () => {
            const todoDataWithoutCompletedStatus = {
                title: properTodoDataWithoutDate.title
            };
            await request(app.app)
                .post(path)
                .set('Authorization', authorizationHeader)
                .send(todoDataWithoutCompletedStatus)
                .expect(400);
        });

        it('should respond with object containing id', async () => {
            const { body } = await request(app.app)
                .post(path)
                .set('Authorization', authorizationHeader)
                .send(properTodoDataWithoutDate);
            expect(body._id).toBeDefined();
        });

        it('should respond with object containing title', async () => {
            const { body } = await request(app.app)
                .post(path)
                .set('Authorization', authorizationHeader)
                .send(properTodoDataWithoutDate);
            expect(body.title).toBeDefined();
        });

        it('should respond with object containing completed status', async () => {
            const { body } = await request(app.app)
                .post(path)
                .set('Authorization', authorizationHeader)
                .send(properTodoDataWithoutDate);
            expect(body.completed).toBeDefined();
        });

        it('should respond with object not containing date when it wasn\'t passed', async () => {
            const { body } = await request(app.app)
                .post(path)
                .set('Authorization', authorizationHeader)
                .send(properTodoDataWithoutDate);
            expect(body.date).toBeUndefined();
        });

        it('should respond with object containing date when it was passed', async () => {
            const { body } = await request(app.app)
                .post(path)
                .set('Authorization', authorizationHeader)
                .send(properTodoDataWithDate);
            expect(body.date).toBeDefined();
        });

        it('should create new todo', async () => {
            const { body } = await request(app.app)
                .post(path)
                .set('Authorization', authorizationHeader)
                .send(properTodoDataWithoutDate);
            const todo = await TodoModel.findById(body._id);
            expect(todo).not.toBeNull();
        });
    });

    describe('GET /todos', () => {
        const path = '/todos';
        let user: UserDocument;
        let authorizationHeader: string;

        beforeEach(async () => {
            user = DbHelper.Instance.fixtureUsers[0]!;
            const token = await user.generateAuthToken();
            authorizationHeader = `Bearer ${token}`;
        });

        it('should return 401 when user is not authenticated', async () => {
            await request(app.app)
                .get(path)
                .send()
                .expect(401);
        });

        it('should return 200 when user is authenticated', async () => {
            await request(app.app)
                .get(path)
                .set('Authorization', authorizationHeader)
                .send()
                .expect(200);
        });

        it('should return empty array when user has no todos', async () => {
            const { body } = await request(app.app)
                .get(path)
                .set('Authorization', authorizationHeader)
                .send();
            expect(body).toEqual([]);
        });

        it('should return list of user todos', async () => {
            const todosJsonObjects = (await DbHelper.Instance.createFixtureTodosForUser(user))
                .map((todo: TodoDocument) => todo.toJSON());
            const { body } = await request(app.app)
                .get(path)
                .set('Authorization', authorizationHeader)
                .send();
            expect(body).toEqual(todosJsonObjects);
        });
    });

    describe('GET /todos/:todoId', () => {
        const path = '/todos';
        let todoId: string;
        let todo: TodoDocument;
        let authorizationHeader: string;

        beforeEach(async () => {
            const user = DbHelper.Instance.fixtureUsers[0]!;
            const todos = await DbHelper.Instance.createFixtureTodosForUser(user);
            todo = todos[0]!;
            todoId = todo._id!.toString();
            const token = await user.generateAuthToken();
            authorizationHeader = `Bearer ${token}`;
        });

        it('should return 401 when user is not authenticated', async () => {
            await request(app.app)
                .get(`${path}/${todoId}`)
                .send()
                .expect(401);
        });

        it('should return 200 when user is authenticated', async () => {
            await request(app.app)
                .get(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send()
                .expect(200);
        });

        it('should return 404 when asked for no existing todo', async () => {
            const todoId = Types.ObjectId().toHexString();
            await request(app.app)
                .get(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send()
                .expect(404);
        });

        it('should respond with requested todo', async () => {
            const { body } = await request(app.app)
                .get(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send();
            expect(body).toEqual(todo.toJSON());
        });
    });

    describe('PATCH /todos/:todoId', () => {
        const path = '/todos';
        let todoDataUpdate: { title?: string, date?: Date | null, completed?: boolean };
        let todoId: string;
        let todo: TodoDocument;
        let authorizationHeader: string;

        beforeEach(async () => {
            const user = DbHelper.Instance.fixtureUsers[0]!;
            const todos = await DbHelper.Instance.createFixtureTodosForUser(user);
            todo = todos[0]!;
            todoId = todo._id!.toString();
            const token = await user.generateAuthToken();
            authorizationHeader = `Bearer ${token}`;
        });

        it('should return 401 when user is not authenticated', async () => {
            todoDataUpdate = { title: 'New title' };
            await request(app.app)
                .patch(`${path}/${todoId}`)
                .send(todoDataUpdate)
                .expect(401);
        });

        it('should return 200 when user is authenticated', async () => {
            todoDataUpdate = { title: 'New title' };
            await request(app.app)
                .patch(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send(todoDataUpdate)
                .expect(200);
        });

        it('should return 404 when asked for no existing todo', async () => {
            const todoId = Types.ObjectId().toHexString();
            todoDataUpdate = { title: 'New title' };
            await request(app.app)
                .get(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send(todoDataUpdate)
                .expect(404);
        });

        it('should respond with todo with modified title when sent title', async () => {
            todoDataUpdate = { title: 'New title' };
            const { body } = await request(app.app)
                .patch(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send(todoDataUpdate);
            expect(body.title).toBe(todoDataUpdate.title);
        });

        it('should respond with todo with modified completed status when sent completed status', async () => {
            todoDataUpdate = { completed: !todo.completed };
            const { body } = await request(app.app)
                .patch(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send(todoDataUpdate);
            expect(body.completed).toBe(todoDataUpdate.completed);
        });

        it('should respond with todo with modified date when sent not null date', async () => {
            todoDataUpdate = { date: new Date() };
            const { body } = await request(app.app)
                .patch(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send(todoDataUpdate);
            expect(body.date).toBe(todoDataUpdate.date!.getTime());
        });

        it('should respond with todo without date when sent null date', async () => {
            todoDataUpdate = { date: null };
            const { body } = await request(app.app)
                .patch(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send(todoDataUpdate);
            expect(body.date).not.toBeDefined();
        });

        it('should save modified todo', async () => {
            todoDataUpdate = {
                title: 'New title',
                date: new Date(),
                completed: !todo.completed
            };
            await request(app.app)
                .patch(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send(todoDataUpdate);
            const updatedTodo = (await TodoModel.findById(todo._id))!;
            expect(updatedTodo.toJSON()).toEqual({
                _id: todo._id!.toString(),
                title: todoDataUpdate.title,
                date: todoDataUpdate.date!.getTime(),
                completed: todoDataUpdate.completed
            })
        });
    });

    describe('DELETE /todo/:todoId', () => {
        const path = '/todos';
        let todoId: string;
        let todo: TodoDocument;
        let authorizationHeader: string;

        beforeEach(async () => {
            const user = DbHelper.Instance.fixtureUsers[0]!;
            const todos = await DbHelper.Instance.createFixtureTodosForUser(user);
            todo = todos[0]!;
            todoId = todo._id!.toString();
            const token = await user.generateAuthToken();
            authorizationHeader = `Bearer ${token}`;
        });

        it('should return 401 when user is not authenticated', async () => {
            await request(app.app)
                .delete(`${path}/${todoId}`)
                .send()
                .expect(401);
        });

        it('should return 200 when user is authenticated', async () => {
            await request(app.app)
                .delete(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send()
                .expect(200);
        });

        it('should return 404 when asked for no existing todo', async () => {
            const todoId = Types.ObjectId().toHexString();
            await request(app.app)
                .delete(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send()
                .expect(404);
        });

        it('should respond with deleted todo', async () => {
            const { body } = await request(app.app)
                .delete(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send();
            expect(body).toEqual(todo.toJSON());
        });

        it('should delete requested todo', async () => {
            await request(app.app)
                .delete(`${path}/${todoId}`)
                .set('Authorization', authorizationHeader)
                .send();
            const deletedTodo = await TodoModel.findById(todo._id);
            expect(deletedTodo).toBeNull();
        });
    });
});
