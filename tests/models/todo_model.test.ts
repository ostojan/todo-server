import TodoModel from '../../src/model/todo_model';
import DbHelper from '../helpers/db_helper';

beforeEach(async () => {
    await DbHelper.Instance.connect();
    await DbHelper.Instance.cleanUp();
    await DbHelper.Instance.createFixtureUsers();
});

afterEach(async () => {
    await DbHelper.Instance.disconnect();
});

describe('TodoModel', () => {
    describe('toJSON', () => {
        it('should return object with only _id, title and completed status when there is no date', async () => {
            const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
            const todo = await TodoModel.create({
                title: 'Todo',
                completed: false,
                owner: fixtureUser._id!
            })
            const todoObject = todo.toObject();
            const jsonObject = todo.toJSON();
            expect(jsonObject).toEqual({
                _id: todoObject._id.toString(),
                title: todoObject.title,
                completed: todoObject.completed
            });
        });

        it('should return object with only _id, title, completed status and date when there is date', async () => {
            const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
            const todo = await TodoModel.create({
                title: 'Todo',
                date: Date.now(),
                completed: false,
                owner: fixtureUser._id!
            })
            const todoObject = todo.toObject();
            const jsonObject = todo.toJSON();
            expect(jsonObject).toEqual({
                _id: todoObject._id.toString(),
                title: todoObject.title,
                date: todoObject.date!.getTime(),
                completed: todoObject.completed
            });
        });

        it('should return date in timestamp format', async () => {
            const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
            const todo = await TodoModel.create({
                title: 'Todo',
                date: Date.now(),
                completed: false,
                owner: fixtureUser._id!
            })
            const todoObject = todo.toObject();
            const jsonObject = todo.toJSON();
            expect(jsonObject.date).toBe(todoObject.date!.getTime());
        });

        it('should return _id as string', async () => {
            const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
            const todo = await TodoModel.create({
                title: 'Todo',
                date: Date.now(),
                completed: false,
                owner: fixtureUser._id!
            })
            const todoObject = todo.toObject();
            const jsonObject = todo.toJSON();
            expect(jsonObject._id!).toBe(todoObject._id!.toString());
        });
    });
});
