import request from 'supertest';

import App from '../../src/app';
import TodoModel from '../../src/model/todo_model';
import UserModel, { User, UserDocument } from '../../src/model/user_model';
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

describe('UserRouter', () => {
    describe('POST /users', () => {
        const path = '/users';
        const properUserData: User = {
            email: 'email@example.com',
            password: 'izBYFMg6^qNBYsUS'
        };

        it('should return 400 when sent no data', async () => {
            await request(app.app)
                .post(path)
                .send()
                .expect(400);
        });

        it('should return 400 when sent data without password', async () => {
            const userDataWithoutPassword = { email: properUserData.email };
            await request(app.app)
                .post(path)
                .send(userDataWithoutPassword)
                .expect(400);
        });

        it('should return 400 when sent data without email', async () => {
            const userDataWithoutEmail = { password: properUserData.password };
            await request(app.app)
                .post(path)
                .send(userDataWithoutEmail)
                .expect(400);
        });

        it('should return 400 when sent password that doesn\'t match requirements', async () => {
            const userDataWithWeakPassword = { ...properUserData };
            userDataWithWeakPassword.password = '3^uFny$';
            await request(app.app)
                .post(path)
                .send(userDataWithWeakPassword)
                .expect(400);
        });

        it('should return 400 when sent malformed email', async () => {
            const userDataWithMalformedEmail = { ...properUserData };
            userDataWithMalformedEmail.email = 'not-an-email';
            await request(app.app)
                .post(path)
                .send(userDataWithMalformedEmail)
                .expect(400);
        });

        it('should return 400 when sent email of existing user', async () => {
            const fixtureUserData = DbHelper.Instance.fixtureUsersData[0];
            await request(app.app)
                .post(path)
                .send(fixtureUserData)
                .expect(400);
        });

        it('should return 200 when sent proper data', async () => {
            await request(app.app)
                .post(path)
                .send(properUserData)
                .expect(200);
        });

        it('should create new user when sent proper data', async () => {
            await request(app.app)
                .post(path)
                .send(properUserData);
            const user = await UserModel.find({ email: properUserData.email });
            expect(user).not.toBeNull();
        });


        it('should respond with user email, id and token when sent proper data', async () => {
            const { body } = await request(app.app)
                .post(path)
                .send(properUserData);
            const user = (await UserModel.findOne({ email: properUserData.email }))!
            expect(body).toMatchObject({
                user: {
                    _id: user._id!.toString(),
                    email: user.email,
                },
                token: user.tokens[0]
            });
        });
    });

    describe('POST /users/login', () => {
        const path = '/users/login';
        let properUserData: User;

        beforeEach(() => {
            properUserData = DbHelper.Instance.fixtureUsersData[0]!;
        });

        it('should return 400 when sent no data', async () => {
            await request(app.app)
                .post(path)
                .send()
                .expect(400);
        });

        it('should return 400 when sent data without password', async () => {
            const userDataWithoutPassword = { email: properUserData.email };
            await request(app.app)
                .post(path)
                .send(userDataWithoutPassword)
                .expect(400);
        });

        it('should return 400 when sent data without email', async () => {
            const userDataWithoutEmail = { password: properUserData.password };
            await request(app.app)
                .post(path)
                .send(userDataWithoutEmail)
                .expect(400);
        });

        it('should return 400 when sent incorrect password', async () => {
            const userDataWithWeakPassword = { ...properUserData };
            userDataWithWeakPassword.password = 'incorrect-passwords';
            await request(app.app)
                .post(path)
                .send(userDataWithWeakPassword)
                .expect(400);
        });

        it('should return 400 when sent incorrect email', async () => {
            const userDataWithMalformedEmail = { ...properUserData };
            userDataWithMalformedEmail.email = 'not-an-email';
            await request(app.app)
                .post(path)
                .send(userDataWithMalformedEmail)
                .expect(400);
        });

        it('should return 200 when sent proper data', async () => {
            await request(app.app)
                .post(path)
                .send(properUserData)
                .expect(200);
        });

        it('should respond with user email, id and token when sent proper data', async () => {
            const { body } = await request(app.app)
                .post(path)
                .send(properUserData);
            const user = (await UserModel.findOne({ email: properUserData.email }))!
            expect(body).toMatchObject({
                user: {
                    _id: user._id!.toString(),
                    email: user.email,
                },
                token: user.tokens[0]
            });
        });
    });

    describe('POST /users/logout', () => {
        const path = '/users/logout';
        let properUser: UserDocument;
        let token: string;
        let authorizationHeader: string;

        beforeEach(async () => {
            properUser = DbHelper.Instance.fixtureUsers[0]!;
            token = await properUser.generateAuthToken();
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
                .send()
                .expect(200);
        });

        it('should remove passed token', async () => {
            await request(app.app)
                .post(path)
                .set('Authorization', authorizationHeader)
                .send();
            const user = (await UserModel.findById(properUser._id))!;
            expect(user.tokens).not.toContain(token);
        });
    });

    describe('POST /users/logoutAll', () => {
        const path = '/users/logoutAll';
        let properUser: UserDocument;
        let token: string;
        let authorizationHeader: string;

        beforeEach(async () => {
            properUser = DbHelper.Instance.fixtureUsers[0]!;
            token = await properUser.generateAuthToken();
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
                .send()
                .expect(200);
        });

        it('should remove all tokens', async () => {
            await request(app.app)
                .post(path)
                .set('Authorization', authorizationHeader)
                .send();
            const user = (await UserModel.findById(properUser._id))!;
            expect(user.tokens.length).toEqual(0);
        });
    });

    describe('GET /users/me', () => {
        const path = '/users/me';
        let properUser: UserDocument;
        let token: string;
        let authorizationHeader: string;

        beforeEach(async () => {
            properUser = DbHelper.Instance.fixtureUsers[0]!;
            token = await properUser.generateAuthToken();
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

        it('should respond with user email and id', async () => {
            const { body } = await request(app.app)
                .get(path)
                .set('Authorization', authorizationHeader)
                .send();
            expect(body).toMatchObject({
                _id: properUser._id!.toString(),
                email: properUser.email,
            })
        });
    });

    describe('PATCH /users/me', () => {
        const path = '/users/me';
        let properUser: UserDocument;
        let token: string;
        let authorizationHeader: string;

        beforeEach(async () => {
            properUser = DbHelper.Instance.fixtureUsers[0]!;
            token = await properUser.generateAuthToken();
            authorizationHeader = `Bearer ${token}`;
        });

        it('should return 401 when user is not authenticated', async () => {
            await request(app.app)
                .patch(path)
                .send()
                .expect(401);
        });

        it('should return 200 when user is authenticated', async () => {
            await request(app.app)
                .patch(path)
                .set('Authorization', authorizationHeader)
                .send()
                .expect(200);
        });

        it('should respond with user new email and id when new email passed', async () => {
            const userDataWithChangedEmail = { email: 'new@email.com' };
            const { body } = await request(app.app)
                .patch(path)
                .set('Authorization', authorizationHeader)
                .send(userDataWithChangedEmail);
            expect(body).toMatchObject({
                _id: properUser._id!.toString(),
                email: userDataWithChangedEmail.email,
            })
        });

        it('should change user email in database', async () => {
            const userDataWithChangedEmail = { email: 'new@email.com' };
            await request(app.app)
                .patch(path)
                .set('Authorization', authorizationHeader)
                .send(userDataWithChangedEmail);
            const modifiedUser = (await UserModel.findById(properUser._id))!;
            expect(modifiedUser.email).toBe(userDataWithChangedEmail.email);
        });

        it('should respond with user new email and id when new password passed', async () => {
            const userDataWithChangedPassword = { password: 'co%taGD^R^c7t2si' };
            const { body } = await request(app.app)
                .patch(path)
                .set('Authorization', authorizationHeader)
                .send(userDataWithChangedPassword);
            expect(body).toMatchObject({
                _id: properUser._id!.toString(),
                email: properUser.email,
            })
        });

        it('should chage user password in database', async () => {
            const userDataWithChangedPassword = { password: 'co%taGD^R^c7t2si' };
            await request(app.app)
                .patch(path)
                .set('Authorization', authorizationHeader)
                .send(userDataWithChangedPassword);
            const user = await UserModel.findByCredentials(properUser.email, userDataWithChangedPassword.password);
            expect(user).not.toBeNull();
        });
    });

    describe('DELETE /users/me', () => {
        const path = '/users/me';
        let user: UserDocument;
        let token: string;
        let authorizationHeader: string;

        beforeEach(async () => {
            user = DbHelper.Instance.fixtureUsers[0]!;
            token = await user.generateAuthToken();
            authorizationHeader = `Bearer ${token}`;
        });

        it('should return 401 when user is not authenticated', async () => {
            await request(app.app)
                .delete(path)
                .send()
                .expect(401);
        });

        it('should return 200 when user is authenticated', async () => {
            await request(app.app)
                .delete(path)
                .set('Authorization', authorizationHeader)
                .send()
                .expect(200);
        });

        it('should respond with deleted user', async () => {
            const { body } = await request(app.app)
                .delete(path)
                .set('Authorization', authorizationHeader)
                .send();
            expect(body).toEqual(user.toJSON());
        });

        it('should delete requested user', async () => {
            await request(app.app)
                .delete(path)
                .set('Authorization', authorizationHeader)
                .send();
            const deletedUser = await UserModel.findById(user._id);
            expect(deletedUser).toBeNull();
        });

        it('should delete requested user todos', async () => {
            await DbHelper.Instance.createFixtureTodosForUser(user);
            await request(app.app)
                .delete(path)
                .set('Authorization', authorizationHeader)
                .send();
            const deletedTodos = await TodoModel.find({ owner: user._id });
            expect(deletedTodos).toEqual([]);
        });
    });
});
