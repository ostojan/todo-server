import { Types } from 'mongoose';

import TodoModel from '../../src/model/todo_model';

describe('TodoModel', () => {
    const todo = new TodoModel({
        title: 'Todo',
        completed: false,
        owner: new Types.ObjectId()
    });
    const todoObject = todo.toObject();
    const todoJson = todo.toJSON();

    describe('toJSON', () => {

        describe('with date', () => {
            const todoWithDate = new TodoModel({
                title: 'Todo',
                completed: false,
                date: new Date(),
                owner: new Types.ObjectId()
            });
            const todoWithDateObject = todoWithDate.toObject();
            const todoWithDateJson = todoWithDate.toJSON();


            it('should return _id, title, completed status and date', async () => {
                expect(todoWithDateJson).toEqual({
                    _id: todoWithDateObject._id.toString(),
                    title: todoWithDateObject.title,
                    date: todoWithDateObject.date!.getTime(),
                    completed: todoWithDateObject.completed
                });
            });

            it('should return date as timestamp', async () => {
                expect(todoWithDateJson.date).toBe(todoWithDateObject.date!.getTime());
            });
        });

        describe('without date', () => {
            it('should return _id, title and completed status', async () => {
                expect(todoJson).toEqual({
                    _id: todoObject._id.toString(),
                    title: todoObject.title,
                    completed: todoObject.completed
                });
            });
        });

        it('should return _id as string', async () => {
            expect(todoJson._id!).toBe(todoObject._id!.toString());
        });
    });
});
