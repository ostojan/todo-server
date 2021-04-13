import App from './app';
import DbConnector from './db/db_connector';

const MONGODB_ADDRESS = process.env['MONGODB_ADDRESS']!;
const PORT = parseInt(process.env['PORT']!);

const main = async () => {
    try {
        const db = new DbConnector(MONGODB_ADDRESS);
        const app = new App(PORT);
        console.log('Connecting to databse...');
        await db.connect();
        console.log('Connected to database');
        app.start();
    } catch (error: any) {
        console.error('An error occured:', error);
        console.error('Server is shutting down');
    }
};

main();
