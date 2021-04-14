import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Document, Model, model, Schema } from 'mongoose';
import validator from 'validator';

import { TodoDocument } from './todo_model';

const JWT_SECRET = process.env['JWT_SECRET']!;

export interface User {
    email: string;
    password: string;
};

export interface UserDocument extends User, Document {
    tokens: Array<string>;
    todos: Array<TodoDocument> | undefined;
    generateAuthToken(): Promise<string>;
    removeAuthToken(token: string): Promise<void>;
    removeAllAuthTokens(): Promise<void>;
};

interface UserModel extends Model<UserDocument> {
    findByCredentials(email: string, password: string): Promise<UserDocument | null>;
    findByToken(token: string): Promise<UserDocument | null>;
};

const UserSchema = new Schema<UserDocument, UserModel>({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate(value: string) {
            if (!validator.isEmail(value)) {
                throw Error('Email address is invalid');
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(this: UserDocument, value: string) {
            if (this.isModified('password') &&
                (!validator.isStrongPassword(value, {
                    minLength: 8,
                    minLowercase: 1,
                    minUppercase: 1,
                    minSymbols: 1,
                    minNumbers: 1,
                }) || value.length > 32)) {
                throw Error('Password doesn\'t meet requirements');
            }
        }
    },
    tokens: [{
        type: String,
        required: true
    }]
});

UserSchema.virtual('todos', {
    ref: 'Todo',
    localField: '_id',
    foreignField: 'owner'
});

UserSchema.pre<UserDocument>('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

UserSchema.methods['toJSON'] = function () {
    const userObject = this.toObject();
    return {
        _id: userObject._id,
        email: userObject.email,
    };
};

UserSchema.methods['generateAuthToken'] = async function (this: UserDocument): Promise<string> {
    const token = jwt.sign({ id: this._id.toString(), iat: Date.now() }, JWT_SECRET);
    this.tokens.push(token);
    await this.save();
    return token;
};

UserSchema.methods['removeAuthToken'] = async function (this: UserDocument, token: string): Promise<void> {
    this.tokens = this.tokens.filter((value: string) => value !== token);
    await this.save();
};

UserSchema.methods['removeAllAuthTokens'] = async function (this: UserDocument): Promise<void> {
    const user = this;
    user.tokens = [];
    await user.save();
};

UserSchema.statics['findByCredentials'] = async function (this: UserModel,
    email: string,
    password: string): Promise<UserDocument | null> {
    const user = await this.findOne({ email: email });
    if (user === null) {
        return null;
    }

    if (!(await bcrypt.compare(password, user.password))) {
        return null;
    }

    return user;
};

UserSchema.statics['findByToken'] = async function (this: UserModel, token: string): Promise<UserDocument | null> {
    try {
        const decodedData = jwt.verify(token, JWT_SECRET) as { id: string };
        const result = await this.findOne({ _id: decodedData.id, tokens: token });
        return result;
    } catch (error) {
        return null;
    }
};

export default model<UserDocument, UserModel>('User', UserSchema);
