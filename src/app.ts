import express, { Express } from 'express';

export default class App {
    public app: Express;
    private port: number;

    constructor(port: number) {
        this.app = express();
        this.app.get('/', (_req, res) => {
            res.status(200);
            res.send();
        });
        this.port = port;
    }

    public start(): void {
        console.log('Starting server...');
        this.app.listen(this.port, () => {
            console.log('Server started on port', this.port);
        });
    }
}
