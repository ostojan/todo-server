import { Document, model, Model, Schema, Types } from 'mongoose';

export interface Todo {
    title: string;
    date?: Date;
    completed: boolean,
    owner: Types.ObjectId
};

export interface TodoDocument extends Todo, Document {
};

interface TodoModel extends Model<TodoDocument> {
};

const TodoSchema = new Schema <TodoDocument, TodoModel>({
    title: {
        type: String,
        required: true
    },
    date: {
        type: Date
    },
    completed: {
        type: Boolean,
        required: true
    },
    owner: {
        type: Types.ObjectId,
        required: true,
        ref: 'User'
    }
});

export default model<TodoDocument, TodoModel>('Todo', TodoSchema);
