const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

const openapiValidator = require('../openapiValidator');
const server = require('../../src/app');
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');

chai.use(openapiValidator);
chai.use(chaiHttp);

const token = jwt.sign(
    {
        userId: 2
    },
    process.env.JWT_ADMIN_SECRET
);

describe('routes: admin history', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('global purchase history', () => {
        describe('querying all purchases', () => {
            it('should return a list of purchases', async () => {
                const res = await chai
                    .request(server)
                    .get('/api/v1/admin/purchaseHistory')
                    .set('Authorization', 'Bearer ' + token);

                expect(res.status).to.equal(200);
                expect(res).to.satisfyApiSpec;
            });
        });

        describe('Querying a purchase by id', () => {
            it('should return a purchase', async () => {
                const res = await chai
                    .request(server)
                    .get('/api/v1/admin/purchaseHistory/1')
                    .set('Authorization', 'Bearer ' + token);

                expect(res.status).to.equal(200);
                expect(res).to.satisfyApiSpec;
            });

            it('should fail with a nonexsisting id', async () => {
                const res = await chai
                    .request(server)
                    .get('/api/v1/admin/purchaseHistory/999999')
                    .set('Authorization', 'Bearer ' + token);

                expect(res.status).to.equal(404);
                expect(res.body.error_code).to.equal('not_found');
                expect(res).to.satisfyApiSpec;
            });
        });
    });

    describe('global deposit history', () => {
        describe('querying all events', () => {
            it('should return list of deposits', async () => {
                const res = await chai
                    .request(server)
                    .get('/api/v1/admin/depositHistory')
                    .set('Authorization', 'Bearer ' + token);

                expect(res.status).to.equal(200);
                expect(res).to.satisfyApiSpec;
            });
        });

        describe('querying deposit by id', () => {
            it('should fail when using a nonexistent id', async () => {
                const res = await chai
                    .request(server)
                    .get('/api/v1/admin/depositHistory/99999999')
                    .set('Authorization', 'Bearer ' + token);

                expect(res.status).to.equal(404);
                expect(res.body.error_code).to.equal('not_found');
                expect(res).to.satisfyApiSpec;
            });

            it('should return a deposit', async () => {
                const res = await chai
                    .request(server)
                    .get('/api/v1/admin/depositHistory/1')
                    .set('Authorization', 'Bearer ' + token);

                expect(res.status).to.equal(200);
                expect(res).to.satisfyApiSpec;
            });
        });
    });
});
