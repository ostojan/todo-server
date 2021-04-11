import DbConnector from './db/db_connector';

const MONGODB_ADDRESS = process.env['MONGODB_ADDRESS']!;

const main = async () => {
    try {
        const db = new DbConnector(MONGODB_ADDRESS);
        console.log('Connecting to databse...');
        await db.connect();
        console.log('Connected to database');
    } catch (error: any) {
        console.error('An error occured:', error);
        console.error('Server is shutting down');
    }
};

main();
