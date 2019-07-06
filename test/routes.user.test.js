const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../src/app');
const knex = require('../src/db/knex');
const jwt = require('../src/jwt/token');
const userStore = require('../src/db/userStore');
const historyStore = require('../src/db/historyStore');

const token = jwt.sign({
    userId: 1
});

describe('routes: user', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Fetching user info', () => {
        it('should return user info', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/user')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('user');
            expect(res.body.user).to.have.all.keys('username', 'fullName', 'email', 'moneyBalance');
        });
    });

    describe('Modifying user info', () => {
        it('should modify user', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/user')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    username: 'abcd',
                    fullName: 'abcd efgh',
                    email: 'abc@def.ghi'
                });

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('user');
            expect(res.body.user).to.have.all.keys('username', 'fullName', 'email', 'moneyBalance');

            expect(res.body.user.username).to.equal('abcd');
            expect(res.body.user.fullName).to.equal('abcd efgh');
            expect(res.body.user.email).to.equal('abc@def.ghi');

            const user = await userStore.findById(1);

            expect(user.name).to.equal('abcd');
            expect(user.realname).to.equal('abcd efgh');
            expect(user.univident).to.equal('abc@def.ghi');
        });

        it('should allow modifying only some fields', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/user')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    email: 'abc@def.ghi'
                });

            expect(res.status).to.equal(200);

            expect(res.body.user.username).to.equal('normal_user');
            expect(res.body.user.fullName).to.equal('John Doe');
            expect(res.body.user.email).to.equal('abc@def.ghi');
        });

        it('should deny changing username to one already taken', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/user')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    username: 'admin_user'
                });

            expect(res.status).to.equal(409);
        });

        it('should deny changing email to one already taken', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/user')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    email: 'admin@example.com'
                });

            expect(res.status).to.equal(409);
        });

        it('should error if no fields are specified', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/user')
                .set('Authorization', 'Bearer ' + token)
                .send({});

            expect(res.status).to.equal(400);
        });
    });

    describe('Depositing money', () => {
        it('should increase account balance', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/user/deposit')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    amount: 150
                });

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('accountBalance', 'deposit');

            expect(res.body.accountBalance).to.equal(650);

            const user = await userStore.findById(1);

            expect(user.saldo).to.equal(650);
        });

        it('should create an event into deposit history', async () => {
            const user = await userStore.findByUsername('normal_user');
            const oldDepositHistory = await historyStore.getUserDepositHistory(user.userid);

            const res = await chai
                .request(server)
                .post('/api/v1/user/deposit')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    amount: 2371
                });

            expect(res.status).to.equal(200);

            const newDepositHistory = await historyStore.getUserDepositHistory(user.userid);

            expect(newDepositHistory.length).to.equal(oldDepositHistory.length + 1);

            const depositEvent = newDepositHistory[0];

            expect(depositEvent.difference).to.equal(2371);
            expect(depositEvent.saldo).to.equal(res.body.accountBalance);
        });

        it('should error on depositing a negative amount', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/user/deposit')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    amount: -200
                });

            expect(res.status).to.equal(400);
        });
    });

    describe('Changing password', () => {
        it('should change the password', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/user/changePassword')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    password: 'abcdefg'
                });

            expect(res.status).to.equal(204);

            const user = await userStore.findById(1);
            const passwordMatches = await userStore.verifyPassword('abcdefg', user.pass);

            expect(passwordMatches).to.be.true;
        });
    });
});
