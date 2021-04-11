import DbConnector from '../../src/db/db_connector';
import UserModel, { User, UserDocument } from '../../src/model/user_model';

const MONGODB_ADDRESS = process.env['MONGODB_ADDRESS']!;

export default class DbHelper {
    private static instance: DbHelper;
    private dbConnector: DbConnector;

    public fixtureUsersData: Array<User> = [
        { email: 'user1@example.com', password: '7SY3S5VTw8sxAK*M' },
    ];
    public fixtureUsers: Array<UserDocument> = [];

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

    public async connect(): Promise<void> {
        await this.dbConnector.connect();
    }

    public async disconnect(): Promise<void> {
        await this.dbConnector.disconnect();
    }
};
