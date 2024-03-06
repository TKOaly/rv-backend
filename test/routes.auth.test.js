const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

const server = require('../src/app');
const knex = require('../src/db/knex');
const jwt = require('../src/jwt/token');
const userStore = require('../src/db/userStore');

chai.use(chaiHttp);

describe('routes: authentication', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });
    describe('User RFID authentication', () => {
        it('with valid credentials, should respond with an authentication token', async () => {
            const res = await chai.request(server).post('/api/v1/authenticate/rfid').send({
                rfid: '1234',
            });

            expect(res.status).to.equal(200);

            const token = jwt.verify(res.body.accessToken);
            expect(token.data.userId).to.exist;

            const user = await userStore.findByUsername('admin_user');
            expect(token.data.userId).to.equal(user.userId);
        });

        it('with invalid rfid, should return a 401 unauthorized response', async () => {
            const res = await chai.request(server).post('/api/v1/authenticate/rfid').send({
                rfid: '12345',
            });
            expect(res.status).to.equal(401);
        });

        it('invalid request should result in a 400 bad request response', async () => {
            const res = await chai.request(server).post('/api/v1/authenticate/rfid').send({
                garbage: 'garbage',
            });

            expect(res.status).to.equal(400);
        });
    });

    describe('User authentication', () => {
        it('with valid credentials, should respond with an authentication token', async () => {
            const res = await chai.request(server).post('/api/v1/authenticate').send({
                username: 'normal_user',
                password: 'hunter2',
            });

            expect(res.status).to.equal(200);

            const token = jwt.verify(res.body.accessToken);
            expect(token.data.userId).to.exist;

            const user = await userStore.findByUsername('normal_user');
            expect(token.data.userId).to.equal(user.userId);
        });

        it('with invalid password, should return a 401 unauthorized response', async () => {
            const res = await chai.request(server).post('/api/v1/authenticate').send({
                username: 'normal_user',
                password: 'incorrect',
            });

            expect(res.status).to.equal(401);
        });

        it('with nonexistent user, should return a 401 unauthorized response', async () => {
            const res = await chai.request(server).post('/api/v1/authenticate').send({
                username: 'nobody',
                password: 'something',
            });

            expect(res.status).to.equal(401);
        });

        it('invalid request should result in a 400 bad request response', async () => {
            const res = await chai.request(server).post('/api/v1/authenticate').send({
                garbage: 'garbage',
            });

            expect(res.status).to.equal(400);
        });
    });
});
