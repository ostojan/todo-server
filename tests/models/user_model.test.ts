
import jwt from 'jsonwebtoken';
import TodoModel from '../../src/model/todo_model';

import UserModel, { User } from '../../src/model/user_model';
import DbHelper from '../helpers/db_helper';

const JWT_SECRET = process.env['JWT_SECRET']!;

beforeEach(async () => {
    await DbHelper.Instance.connect();
    await DbHelper.Instance.cleanUp();
    await DbHelper.Instance.createFixtureUsers();
});

afterEach(async () => {
    await DbHelper.Instance.disconnect();
});

describe('User', () => {
    const properUserData: User = {
        email: 'email@example.com',
        password: '7Q5su!ommtvgNvoQ'
    };

    describe('save', () => {
        const shouldThrowError = async (fn: () => Promise<void>) => {
            await expect(fn())
                .rejects
                .toThrow();
        };

        const shouldNotThrowError = async (fn: () => Promise<void>) => {
            await expect(fn())
                .resolves
                .not
                .toThrow();
        };

        it('should store new user', async () => {
            const newUser = await UserModel.create(properUserData);
            expect(UserModel.findById(newUser.id)).not.toBeNull();
        });

        it('should throw an error when email is incorrect', async () => {
            const userDataWithIncorrectEmail: User = { ...properUserData };
            userDataWithIncorrectEmail.email = 'totally-not-an-email';
            await shouldThrowError(async () => {
                await UserModel.create(userDataWithIncorrectEmail);
            });
        });

        it('should throw an error when email is empty', async () => {
            const userDataWithEmptyEmail: User = { ...properUserData };
            userDataWithEmptyEmail.email = '';
            await shouldThrowError(async () => {
                await UserModel.create(userDataWithEmptyEmail);
            });
        });

        it('should throw an error when password doesn\'t contain an uppercase letter', async () => {
            const userWithPasswordWithoutUppercaseLetter: User = { ...properUserData };
            userWithPasswordWithoutUppercaseLetter.password = 'k62bue7m6z$69q%z';
            await shouldThrowError(async () => {
                await UserModel.create(userWithPasswordWithoutUppercaseLetter);
            });
        });

        it('should throw an error when password doesn\'t contain a lowercase letter', async () => {
            const userWithPasswordWithoutLowercaseLetter: User = { ...properUserData };
            userWithPasswordWithoutLowercaseLetter.password = '6CH*DMH3J42^JP^*';
            await shouldThrowError(async () => {
                await UserModel.create(userWithPasswordWithoutLowercaseLetter);
            });
        });

        it('should throw an error when password doesn\'t contain a number', async () => {
            const userWithPasswordWithoutNumber: User = { ...properUserData };
            userWithPasswordWithoutNumber.password = 'fUTevBH$ZtXAaf$#';
            await shouldThrowError(async () => {
                await UserModel.create(userWithPasswordWithoutNumber);
            });
        });

        it('should throw an error when password doesn\'t contain a special character', async () => {
            const userWithPasswordWithoutSpecialCharacter: User = { ...properUserData };
            userWithPasswordWithoutSpecialCharacter.password = 'ZzEmyxU2aaB5e7TP';
            await shouldThrowError(async () => {
                await UserModel.create(userWithPasswordWithoutSpecialCharacter);
            });
        });

        it('should throw an error when password is less than 8 characters long', async () => {
            const userWithShortPassword: User = { ...properUserData };
            userWithShortPassword.password = 'Q^rEQG8';
            await shouldThrowError(async () => {
                await UserModel.create(userWithShortPassword);
            });
        });

        it('should throw an error when password is more than 32 characters long', async () => {
            const userWithLongPassword: User = { ...properUserData };
            userWithLongPassword.password = '!v9rVsJEHy!5b#%2aZcbfE4u#zxKKH$eA';
            await shouldThrowError(async () => {
                await UserModel.create(userWithLongPassword);
            });
        });

        it('shouldn\'t throw an error when password is 8 characters long', async () => {
            const userWith8CharactersPassword: User = { ...properUserData };
            userWith8CharactersPassword.password = 'MsvCq8#4';
            await shouldNotThrowError(async () => {
                await UserModel.create(userWith8CharactersPassword);
            });
        });

        it('shouldn\'t throw an error when password is 32 characters long', async () => {
            const userWith32CharactersPassword: User = { ...properUserData };
            userWith32CharactersPassword.password = 'bgf2DSEZKzCxzTx@Qyq!DZm^yB9&e2Tp';
            await shouldNotThrowError(async () => {
                await UserModel.create(userWith32CharactersPassword);
            });
        });

        it('shouldn\'t store password in plaintext', async () => {
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

    describe('toJSON', () => {
        it('should return object with only id and email', () => {
            const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
            const userObject = fixtureUser.toObject();
            const jsonObject = fixtureUser.toJSON();
            expect(jsonObject).toEqual({
                _id: userObject._id.toString(),
                email: userObject.email
            });
        });

        it('should return _id as string', async () => {
            const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
            const userObject = fixtureUser.toObject();
            const jsonObject = fixtureUser.toJSON();
            expect(jsonObject._id!).toBe(userObject._id!.toString());
        });
    });

    describe('generateAuthToken', () => {
        it('should return token containing user id', async () => {
            const fixtureUser = DbHelper.Instance.fixtureUsers[0]!;
            const token = await fixtureUser.generateAuthToken();
            const tokenData = jwt.verify(token, JWT_SECRET) as { id: string };
            expect(tokenData.id).toBe(fixtureUser._id!.toString());
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
        it('should return null when there is no user with provided email', async () => {
            const fixtureUsersData = DbHelper.Instance.fixtureUsersData[0]!;
            const user = await UserModel.findByCredentials('new@email.com', fixtureUsersData.password);
            expect(user).toBeNull();
        });

        it('should return null when provided password is incorrect', async () => {
            const fixtureUsersData = DbHelper.Instance.fixtureUsersData[0]!;
            const user = await UserModel.findByCredentials(fixtureUsersData.email, 'wrong-password');
            expect(user).toBeNull();
        });

        it('should return user when provided data is correct', async () => {
            const fixtureUsersData = DbHelper.Instance.fixtureUsersData[0]!;
            const user = await UserModel.findByCredentials(fixtureUsersData.email, fixtureUsersData.password);
            expect(user).not.toBeNull();
        });
    });

    describe('findByToken', () => {
        it('should return null when token is incorrect', async () => {
            const fixtureUsers = DbHelper.Instance.fixtureUsers[0]!;
            await fixtureUsers.generateAuthToken();
            const user = await UserModel.findByToken('not-a-token');
            expect(user).toBeNull();
        });

        it('should return user when token is correct', async () => {
            const fixtureUsers = DbHelper.Instance.fixtureUsers[0]!;
            const token = await fixtureUsers.generateAuthToken();
            const user = await UserModel.findByToken(token);
            expect(user).not.toBeNull();
        });
    });

    describe('populate', () => {
        it('should return user with undefined todos field when user is not populated', async () => {
            const fixtureUsers = DbHelper.Instance.fixtureUsers[0]!;
            expect(fixtureUsers.todos).toBeUndefined();
        });

        it('should return user with not an undefined todos field when user is populated and has no todos', async () => {
            const fixtureUsers = DbHelper.Instance.fixtureUsers[0]!;
            await fixtureUsers.populate('todos').execPopulate();
            expect(fixtureUsers.todos).not.toBeUndefined();
        });

        it('should return user with array of user todos', async () => {
            const fixtureUsers = DbHelper.Instance.fixtureUsers[0]!;
            await DbHelper.Instance.createFixtureTodosForUser(fixtureUsers);
            await fixtureUsers.populate('todos').execPopulate();
            fixtureUsers.todos?.forEach((todo) => {
                expect(todo.owner).toEqual(fixtureUsers._id);
            });
        });

    });
});
