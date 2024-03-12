const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

const server = require('../src/app');
const knex = require('../src/db/knex');
const jwt = require('../src/jwt/token');

chai.use(chaiHttp);

const token = jwt.sign({
    userId: 1,
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
        });
    });

    describe('Fetching single deposit by id', () => {
        it('should return the deposit event', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/user/depositHistory/3')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
        });

        it('should return 404 on nonexistent deposit event', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/user/depositHistory/6677614')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
        });
    });
});
