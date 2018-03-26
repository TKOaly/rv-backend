process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test secret';

const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const request = chai.request(server);
const knex = require('../../src/db/knex.js');
const jwt = require('../../src/jwt/token');
const userStore = require('../../src/db/userStore');

describe('routes: register', () => {
    beforeEach((done) => {
        knex.migrate.rollback()
            .then(() => {
                knex.migrate.latest()
                    .then(() => {
                        knex.seed.run()
                            .then(() => {
                                done();
                            });
                    });
            });
    });

    afterEach((done) => {
        knex.migrate.rollback()
            .then(() => {
                done();
            });
    });

    describe('Trying to register with missing field or bad password etc', () => {
        // var token = jwt.sign({
        //     username: 'normal_user'


        it('with missing keys error should be sent with list of missing fields', (done) => {
            chai.request(server)
                .post('/api/v1/user/register')
                .send({
                    // empty string
                })
                .end((err, res) => {
                    should.exist(err);
                    res.status.should.equal(400);
                    expect(res.body.error).to.equal('Missing: username,password,realname,email');
                    done();
                });
        });

        it('User name should have length of 4 or more', (done) => {
            chai.request(server)
                .post('/api/v1/user/register')
                .send({
                    username: 'tes',
                    password: 'test',
                    realname: 'm.erkki',
                    email: 'erkki@testi.com'
                })
                .end((err, res) => {
                    should.exist(err);
                    res.status.should.equal(400);
                    expect(res.body.error).to.equal('Username has at least 4 characters.');
                    done();
                });
        });


        it('User password should have length of 4 or more', (done) => {
            chai.request(server)
                .post('/api/v1/user/register')
                .send({
                    username: 'test',
                    password: 'tes',
                    realname: 'm.erkki',
                    email: 'erkki@testi.com'
                })
                .end((err, res) => {
                    should.exist(err);
                    res.status.should.equal(400);
                    expect(res.body.error).to.equal('Password has at least 4 characters.');
                    done();
                });
        });

    });

    describe('Usernames and Emails should be uniques', () => {

        it('Username should be unique', (done) => {
            chai.request(server)
                .post('/api/v1/user/register')
                .send({
                    username: 'normal_user',
                    password: 'test',
                    realname: 'm.erkki',
                    email: 'erkki@testi.com'
                })
                .end((err, res) => {
                    should.exist(err);
                    res.status.should.equal(403);
                    expect(res.body.error).to.equal('Username already in use.');
                    done();
                });
        });

        it('Username should be unique', (done) => {
            chai.request(server)
                .post('/api/v1/user/register')
                .send({
                    username: 'test',
                    password: 'test',
                    realname: 'm.erkki',
                    email: 'user@example.com'
                })
                .end((err, res) => {
                    should.exist(err);
                    res.status.should.equal(403);
                    expect(res.body.error).to.equal('Email already in use.');
                    done();
                });
        });
    });

    describe('User should be able to register to service', () => {
        it('With all required fields user should be registered to service', (done) => {
            chai.request(server)
                .post('/api/v1/user/register')
                .send({
                    username: 'test',
                    password: 'test',
                    realname: 'm.erkki',
                    email: 'erkki@test.com'
                })
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(201);
                    done();
                });
        });
    });
});

