const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');

const { GLOBAL_DEFAULT_MARGIN } = require('../../src/db/preferences');

const token = jwt.sign(
    { userId: 2 },
    process.env.JWT_ADMIN_SECRET
);

describe('routes: admin default margin', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Fetching the default value', () => {
        it(`should return ${ GLOBAL_DEFAULT_MARGIN.default }`, async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/defaultMargin')
                .set('Authorization', `Bearer ${ token }`);

            expect(res.status).to.equal(200);
            expect(res).to.satisfyApiSpec;
            expect(res.body.margin).to.equal(GLOBAL_DEFAULT_MARGIN.default);
        });
    });

    describe('Setting a value', () => {
        it('should return the set value', async () => {
            const set_res = await chai
                .request(server)
                .patch('/api/v1/admin/defaultMargin')
                .set('Authorization', `Bearer ${ token }`)
                .send({
                    margin: 0.2
                });

            expect(set_res.status).to.equal(200);

            const res = await chai
                .request(server)
                .get('/api/v1/admin/defaultMargin')
                .set('Authorization', `Bearer ${ token }`);

            expect(res.status).to.equal(200);
            expect(res).to.satisfyApiSpec;
            expect(res.body.margin).to.equal(0.2);
        });
    });
});
