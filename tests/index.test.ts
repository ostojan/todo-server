import request from 'supertest';
import App from '../src/app';

const PORT = parseInt(process.env['PORT']!);

describe('index test', () => {
    it('should pass', async () => {
        await request(new App(PORT).app)
            .get('/')
            .send()
            .expect(200);
    });
});
