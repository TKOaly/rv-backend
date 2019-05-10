process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test secret';

const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../src/app');
const knex = require('../src/db/knex');
const jwt = require('../src/jwt/token');

const token = jwt.sign({
    username: 'normal_user'
});

describe('routes: userDepositHistory', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Fetching user deposit history', () => {
        it('should return user deposit history', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/user/depositHistory')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('deposits');
            expect(res.body.deposits).to.be.an('array');
            for (const deposit of res.body.deposits) {
                expect(deposit).to.have.all.keys('depositId', 'time', 'amount', 'balanceAfter');
            }
        });
    });

    describe('Fetching single deposit by id', () => {
        it('should return the deposit event', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/user/depositHistory/3')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('deposit');
            expect(res.body.deposit).to.have.all.keys('depositId', 'time', 'amount', 'balanceAfter');
        });

        it('should return 404 on nonexistent deposit event', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/user/depositHistory/6677614')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
        });

        it('should have the time as string in ISO 8601 format', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/user/depositHistory/2')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body.deposit.time).to.equal('2018-12-24T00:00:05.000Z');
        });
    });
});
