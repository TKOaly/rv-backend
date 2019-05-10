const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');

describe('routes: admin authentication', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Admin authentication', () => {
        it('logging in with admin role should work', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/authenticate')
                .send({
                    username: 'admin_user',
                    password: 'admin123'
                });

            expect(res.body).to.have.all.keys('accessToken');

            const decoded = jwt.verify(res.body.accessToken, process.env.JWT_ADMIN_SECRET);
            expect(decoded.data.username).to.equal('admin_user');
        });

        it('admin tokens should not be signed with the same key as user tokens', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/authenticate')
                .send({
                    username: 'admin_user',
                    password: 'admin123'
                });

            const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
            expect(decoded).to.equal(null);
        });

        it('only admins should be able to authenticate', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/authenticate')
                .send({
                    username: 'normal_user',
                    password: 'hunter2'
                });

            expect(res.status).to.equal(403);
        });
    });
});
