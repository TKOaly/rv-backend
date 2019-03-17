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
    beforeEach((done) => {
        knex.migrate.rollback().then(() => {
            knex.migrate.latest().then(() => {
                knex.seed.run().then(() => {
                    done();
                });
            });
        });
    });

    afterEach((done) => {
        knex.migrate.rollback().then(() => {
            done();
        });
    });

    describe('User authentication', () => {
        it('with valid credentials, should respond with an authentication token', (done) => {
            chai.request(server)
                .post(AUTH_PATH)
                .type('form')
                .send({
                    username: 'normal_user',
                    password: 'hunter2'
                })
                .end((err, res) => {
                    res.status.should.equal(200);
                    expect(res.body).to.have.all.keys('accessToken');

                    const token = jwt.verify(res.body.accessToken);
                    should.exist(token.data.username);
                    token.data.username.should.equal('normal_user');

                    done();
                });
        });

        it('with invalid password, should return a 401 unauthorized response', (done) => {
            chai.request(server)
                .post(AUTH_PATH)
                .type('form')
                .send({
                    username: 'normal_user',
                    password: 'incorrect'
                })
                .end((err, res) => {
                    res.status.should.equal(401);
                    done();
                });
        });

        it('with nonexistent user, should return a 401 unauthorized response', (done) => {
            chai.request(server)
                .post(AUTH_PATH)
                .type('form')
                .send({
                    username: 'nobody',
                    password: 'something'
                })
                .end((err, res) => {
                    res.status.should.equal(401);
                    done();
                });
        });

        it('invalid request should result in a 400 bad request response', (done) => {
            chai.request(server)
                .post(AUTH_PATH)
                .type('form')
                .send('garbage')
                .end((err, res) => {
                    res.status.should.equal(400);
                    done();
                });
        });
    });
});
