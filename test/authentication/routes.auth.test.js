const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const request = chai.request(server);
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');

const AUTH_PATH = '/api/v1/authenticate';

describe('routes: authentication', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('User authentication', () => {
        it('with valid credentials, should respond with an authentication token', async () => {
            const res = await chai
                .request(server)
                .post(AUTH_PATH)
                .type('form')
                .send({
                    username: 'normal_user',
                    password: 'hunter2'
                });

            res.status.should.equal(200);
            expect(res.body).to.have.all.keys('accessToken');

            const token = jwt.verify(res.body.accessToken);
            should.exist(token.data.username);
            token.data.username.should.equal('normal_user');
        });

        it('with invalid password, should return a 401 unauthorized response', async () => {
            const res = await chai
                .request(server)
                .post(AUTH_PATH)
                .type('form')
                .send({
                    username: 'normal_user',
                    password: 'incorrect'
                });

            res.status.should.equal(401);
        });

        it('with nonexistent user, should return a 401 unauthorized response', async () => {
            const res = await chai
                .request(server)
                .post(AUTH_PATH)
                .type('form')
                .send({
                    username: 'nobody',
                    password: 'something'
                });

            res.status.should.equal(401);
        });

        it('invalid request should result in a 400 bad request response', async () => {
            const res = await chai
                .request(server)
                .post(AUTH_PATH)
                .type('form')
                .send('garbage');

            res.status.should.equal(400);
        });
    });
});
