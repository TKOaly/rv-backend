process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test secret';
process.env.JWT_ADMIN_SECRET = 'admin test secret';

const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');

describe('routes: admin products', () => {
    const server = require('../../src/app');
    const request = chai.request(server);
    
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

    describe('products', () => {
        it('admins should be able to get product list', (done) => {
            const token = jwt.sign(
                { username: 'admin_user' },
                process.env.JWT_ADMIN_SECRET
            );

            chai.request(server)
                .get('/api/v1/admin/products')
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    should.not.exist(err);
                    should.exist(res.body.products);
                    done();
                });
        });
    });
});
