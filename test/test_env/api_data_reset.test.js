const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const server = require('../../src/app');

describe('routes: API data reset', () => {
    describe('Data reset', () => {
        it('should return HTTP 500 if trying to reset API data from production', async () => {
            process.env.NODE_ENV = 'production';
            const res = await chai.request(server).post('/api/v1/test/reset_data');
            expect(res.status).to.equal(500);
            expect(res.body.error).to.equal(true);
            expect(res.body.message).to.equal('API not running in development, test or CI environment');
        });
        it('should return HTTP 200 if environment is set correctly (test)', async () => {
            process.env.NODE_ENV = 'test';
            const res = await chai.request(server).post('/api/v1/test/reset_data');
            expect(res.body).to.have.all.keys(['message', 'error']);
            expect(res.body.error).to.equal(false);
            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Successfully reset API data');
        });
    });
});
