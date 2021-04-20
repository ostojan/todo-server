
import jwt from 'jsonwebtoken';
import TodoModel from '../../src/model/todo_model';

import UserModel, { User, UserDocument } from '../../src/model/user_model';
import DbHelper from '../helpers/db_helper';

const JWT_SECRET = process.env['JWT_SECRET']!;

describe('User', () => {
    const properUserData: User = {
        email: 'email@example.com',
        password: '7Q5su!ommtvgNvoQ'
    };

    const shouldThrowError = async (fn: () => Promise<void>) => {
        await expect(fn())
            .rejects
            .toThrow();
    };

    describe('no database connection', () => {
        describe('validate', () => {
            it('should throw an error when email is incorrect', async () => {
                const userDataWithIncorrectEmail: User = { ...properUserData };
                userDataWithIncorrectEmail.email = 'totally-not-an-email';
                await shouldThrowError(async () => {
                    await new UserModel(userDataWithIncorrectEmail).validate();
                });
            });

            it('should throw an error when email is empty', async () => {
                const userDataWithEmptyEmail: User = { ...properUserData };
                userDataWithEmptyEmail.email = '';
                await shouldThrowError(async () => {
                    await new UserModel(userDataWithEmptyEmail).validate();
                });
            });

            it('should throw an error when password does not contain at least 1 uppercase letter', async () => {
                const userWithPasswordWithoutUppercaseLetter: User = { ...properUserData };
                userWithPasswordWithoutUppercaseLetter.password = 'k62bue7m6z$69q%z';
                await shouldThrowError(async () => {
                    await new UserModel(userWithPasswordWithoutUppercaseLetter).validate();
                });
            });

            it('should throw an error when password does not contain at least 1 lowercase letter', async () => {
                const userWithPasswordWithoutLowercaseLetter: User = { ...properUserData };
                userWithPasswordWithoutLowercaseLetter.password = '6CH*DMH3J42^JP^*';
                await shouldThrowError(async () => {
                    await new UserModel(userWithPasswordWithoutLowercaseLetter).validate();
                });
            });

            it('should throw an error when password does not contain at least 1 number', async () => {
                const userWithPasswordWithoutNumber: User = { ...properUserData };
                userWithPasswordWithoutNumber.password = 'fUTevBH$ZtXAaf$#';
                await shouldThrowError(async () => {
                    await new UserModel(userWithPasswordWithoutNumber).validate();
                });
            });

            it('should throw an error when password does not contain at least 1 special character', async () => {
                const userWithPasswordWithoutSpecialCharacter: User = { ...properUserData };
                userWithPasswordWithoutSpecialCharacter.password = 'ZzEmyxU2aaB5e7TP';
                await shouldThrowError(async () => {
                    await new UserModel(userWithPasswordWithoutSpecialCharacter).validate();
                });
            });

            it('should throw an error when password is shorter than 8 characters long', async () => {
                const userWithShortPassword: User = { ...properUserData };
                userWithShortPassword.password = 'Q^rEQG8';
                await shouldThrowError(async () => {
                    await new UserModel(userWithShortPassword).validate();
                });
            });

            it('should throw an error when password is longer than 32 characters long', async () => {
                const userWithLongPassword: User = { ...properUserData };
                userWithLongPassword.password = '!v9rVsJEHy!5b#%2aZcbfE4u#zxKKH$eA';
                await shouldThrowError(async () => {
                    await new UserModel(userWithLongPassword).validate();
                });
            });
        });

        describe('toJSON', () => {
            const user = new UserModel(properUserData);
            const userObject = user.toObject();
            const jsonObject = user.toJSON();

            it('should return _id and email', () => {
                expect(jsonObject).toEqual({
                    _id: userObject._id.toString(),
                    email: userObject.email
                });
            });

            it('should return _id as string', async () => {
                expect(jsonObject._id!).toBe(userObject._id!.toString());
            });
        });
    });

    describe('database connection', () => {
        beforeEach(async () => {
            await DbHelper.Instance.connect();
            await DbHelper.Instance.cleanUp();
            await DbHelper.Instance.createFixtureUsers();
        });

        afterEach(async () => {
            await DbHelper.Instance.disconnect();
        });

        describe('save', () => {
            it('should not store password in plaintext', async () => {
                const userData: User = { ...properUserData };
                const user = await UserModel.create(userData);
                expect(user.password).not.toBe(userData.password);
            });
        });

        describe('remove', () => {
            it('should remove all todo of deleted user', async () => {
                const user = DbHelper.Instance.fixtureUsers[0]!;
                DbHelper.Instance.createFixtureTodosForUser(user);
                await user.remove();
                const todos = await TodoModel.find({ owner: user._id });
                expect(todos).toEqual([]);
            })
        });

        describe('generateAuthToken', () => {
            it('should return token containing user _id', async () => {
                const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
                const token = await fixtureUser.generateAuthToken();
                const tokenData = jwt.verify(token, JWT_SECRET) as { _id: string };
                expect(tokenData._id).toBe(fixtureUser._id!.toString());
            });

            it('should save generated token', async () => {
                const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
                const token = await fixtureUser.generateAuthToken();
                expect(fixtureUser.tokens).toContain(token);
            });
        });

        describe('removeAuthToken', () => {
            it('should remove token', async () => {
                const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
                const token = await fixtureUser.generateAuthToken();
                await fixtureUser.removeAuthToken(token);
                expect(fixtureUser.tokens).not.toContain(token);
            });

            it('should remove only passed token', async () => {
                const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
                await fixtureUser.generateAuthToken();
                await fixtureUser.generateAuthToken();
                const token = await fixtureUser.generateAuthToken();
                const allTokens = fixtureUser.tokens.length;
                await fixtureUser.removeAuthToken(token);
                expect(fixtureUser.tokens.length).toBe(allTokens - 1);
            });
        });

        describe('removeAllAuthTokens', () => {
            it('should remove all tokens', async () => {
                const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
                await fixtureUser.generateAuthToken();
                await fixtureUser.generateAuthToken();
                await fixtureUser.generateAuthToken();
                await fixtureUser.removeAllAuthTokens();
                expect(fixtureUser.tokens.length).toBe(0);
            });
        });


        describe('findByCredentials', () => {
            const fixtureUsersData = DbHelper.Instance.fixtureUsersData[0]!;

            it('should return null when there is no user with provided email', async () => {
                const user = await UserModel.findByCredentials('new@email.com', fixtureUsersData.password);
                expect(user).toBeNull();
            });

            it('should return null when provided password is incorrect', async () => {
                const user = await UserModel.findByCredentials(fixtureUsersData.email, 'wrong-password');
                expect(user).toBeNull();
            });

            it('should return user when provided data is correct', async () => {
                const user = await UserModel.findByCredentials(fixtureUsersData.email, fixtureUsersData.password);
                expect(user).not.toBeNull();
            });
        });

        describe('findByToken', () => {
            let token: string;
            beforeEach(async () => {
                const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
                token = await fixtureUser.generateAuthToken();
            });

            it('should return null when token is incorrect', async () => {
                const user = await UserModel.findByToken('not-a-token');
                expect(user).toBeNull();
            });

            it('should return user when token is correct', async () => {
                const user = await UserModel.findByToken(token);
                expect(user).not.toBeNull();
            });
        });

        describe('populate', () => {
            let fixtureUser: UserDocument;

            beforeEach(() => {
                fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
            });

            it('should return user with undefined todos field when user is not populated', async () => {
                expect(fixtureUser.todos).toBeUndefined();
            });

            it('should return user with not an undefined todos field when user is populated and has no todos', async () => {
                await fixtureUser.populate('todos').execPopulate();
                expect(fixtureUser.todos).not.toBeUndefined();
            });

            it('should return user with array of user todos', async () => {
                await DbHelper.Instance.createFixtureTodosForUser(fixtureUser);
                await fixtureUser.populate('todos').execPopulate();
                fixtureUser.todos?.forEach((todo) => {
                    expect(todo.owner).toEqual(fixtureUser._id);
                });
            });

        });
    });
});
