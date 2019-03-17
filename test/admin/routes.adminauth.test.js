const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const request = chai.request(server);
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');

describe('routes: admin authentication', () => {
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

    describe('Admin authentication', () => {
        it('logging in with admin role should work', (done) => {
            chai.request(server)
                .post('/api/v1/admin/authenticate')
                .send({
                    username: 'admin_user',
                    password: 'admin123'
                })
                .end((err, res) => {
                    expect(res.body).to.have.all.keys('accessToken');

                    const decoded = jwt.verify(res.body.accessToken, process.env.JWT_ADMIN_SECRET);
                    expect(decoded.data.username).to.equal('admin_user');
                    done();
                });
        });

        it('admin tokens should not be signed with the same key as user tokens', (done) => {
            chai.request(server)
                .post('/api/v1/admin/authenticate')
                .send({
                    username: 'admin_user',
                    password: 'admin123'
                })
                .end((err, res) => {
                    const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
                    expect(decoded).to.equal(null);
                    done();
                });
        });

        it('only admins should be able to authenticate', (done) => {
            chai.request(server)
                .post('/api/v1/admin/authenticate')
                .send({
                    username: 'normal_user',
                    password: 'hunter2'
                })
                .end((err, res) => {
                    res.status.should.equal(403);
                    done();
                });
        });
    });
});
