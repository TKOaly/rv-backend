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

describe('routes: account', () => {
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

    describe('User info', () => {
        const token = jwt.sign({
            username: 'normal_user'
        });

        it('with valid token, should respond with user info', (done) => {
            chai.request(server)
                .get('/api/v1/user/account')
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    done();
                });
        });
    });

    describe('User account actions', () => {
        const token = jwt.sign({
            username: 'normal_user'
        });

        it('debiting should reduce account balance', (done) => {
            chai.request(server)
                .post('/api/v1/user/account/debit')
                .send({
                    amount: 150
                })
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    should.exist(res.body.account_balance);
                    expect(res.body.account_balance).to.equal(350);
                    done();
                });
        });

        it('debiting a negative amount should not work', (done) => {
            chai.request(server)
                .post('/api/v1/user/account/debit')
                .send({
                    amount: -200
                })
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    should.exist(err);
                    res.status.should.equal(400);
                    done();
                });
        });

        it('debiting when account balance is not positive should not work', (done) => {
            userStore.updateAccountBalance('normal_user', -500).then(() => {
                chai.request(server)
                    .post('/api/v1/user/account/debit')
                    .set('Authorization', 'Bearer ' + token)
                    .send({
                        amount: 100
                    })
                    .end((err, res) => {
                        should.exist(err);
                        res.status.should.equal(403);
                        done();
                    });
            });
        });

        it('crediting should increase account balance', (done) => {
            chai.request(server)
                .post('/api/v1/user/account/credit')
                .send({
                    amount: 150
                })
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    should.exist(res.body.account_balance);
                    expect(res.body.account_balance).to.equal(650);
                    done();
                });
        });

        it('crediting a negative amount should not work', (done) => {
            chai.request(server)
                .post('/api/v1/user/account/credit')
                .send({
                    amount: -200
                })
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    should.exist(err);
                    res.status.should.equal(400);
                    done();
                });
        });
    });
});
