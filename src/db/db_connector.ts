import mongoose, { Mongoose } from 'mongoose';

export default class DbConnector {
    private uri: string;
    private mongooseInstance: Mongoose | null = null;

    constructor(uri: string) {
        this.uri = uri;
    }

    public async connect(): Promise<void> {
        this.mongooseInstance = await mongoose.connect(this.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        });
    }

    public async disconnect(): Promise<void> {
        await this.mongooseInstance?.disconnect();
        this.mongooseInstance = null;
    }
};
