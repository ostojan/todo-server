import { Types } from 'mongoose';
import DbConnector from '../../src/db/db_connector';
import TodoModel, { Todo, TodoDocument } from '../../src/model/todo_model';
import UserModel, { User, UserDocument } from '../../src/model/user_model';

const MONGODB_ADDRESS = process.env['MONGODB_ADDRESS']!;

export default class DbHelper {
    private static instance: DbHelper;
    private dbConnector: DbConnector;

    public fixtureUsersData: Array<User> = [
        { email: 'user1@example.com', password: '7SY3S5VTw8sxAK*M' },
    ];
    public fixtureUsers: Array<UserDocument> = [];

    public fixtureTodosData: Array<Todo> = [
        // owners will be assigned during creation
        { title: 'Todo 1', completed: false, owner: new Types.ObjectId() },
        { title: 'Todo 2', completed: true, owner: new Types.ObjectId() },
    ];

    private constructor() {
        this.dbConnector = new DbConnector(MONGODB_ADDRESS);
    }

    public static get Instance(): DbHelper {
        return this.instance || (this.instance = new DbHelper());
    }

    public async cleanUp(): Promise<void> {
        this.fixtureUsers = [];
        await UserModel.deleteMany({});
    }

    public async createFixtureUsers(): Promise<void> {
        for (let userIdx = 0; userIdx < this.fixtureUsersData.length; userIdx++) {
            this.fixtureUsers.push(await UserModel.create(this.fixtureUsersData[userIdx]));
        }
    }

    public async createFixtureTodosForUser(user: UserDocument): Promise<Array<TodoDocument>> {
        const fixtureTodos: Array<TodoDocument> = [];
        for (let todoIdx = 0; todoIdx < this.fixtureTodosData.length; todoIdx++) {
            const todoData = { ...this.fixtureTodosData[todoIdx]! };
            todoData.owner = user._id!;
            fixtureTodos.push(await TodoModel.create(todoData));
        }
        return fixtureTodos;
    }

    public async connect(): Promise<void> {
        await this.dbConnector.connect();
    }

    public async disconnect(): Promise<void> {
        await this.dbConnector.disconnect();
    }
};
