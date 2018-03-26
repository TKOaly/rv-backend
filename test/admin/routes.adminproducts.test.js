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
        const token = jwt.sign(
            { username: 'admin_user' },
            process.env.JWT_ADMIN_SECRET
        );

        it('admins should be able to get product list', (done) => {
            
            chai.request(server)
                .get('/api/v1/admin/products')
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    should.not.exist(err);
                    should.exist(res.body.products);
                    done();
                });
        });

        it('Requesting product with existing barcode', async () => {
        
            return chai.request(server)
                .get('/api/v1/admin/products/5029578000972')
                .set('Authorization', 'Bearer ' + token)
                .then((res) => {
                    res.status.should.equal(200, 'Existing barcode should return product');
                    res.body.product['barcode'].should.equal('5029578000972');
                })
                .catch((err) => {
                    throw err;
                });
        });

        it('Requesting product with malformated barcode', async () => {
        
            return chai.request(server)
                .get('/api/v1/admin/products/1337')
                .set('Authorization', 'Bearer ' + token)
                .then((res) => {
                    res.status.should.not.equal(200);
                })
                .catch((err) => {
                    err.status.should.equal(400, 'malformated barcode should return error');
                });
        });

        it('Requesting product with nonexisting barcode', async () => {
        
            return chai.request(server)
                .get('/api/v1/admin/products/1234567890123')
                .set('Authorization', 'Bearer ' + token)
                .then((res) => {
                    res.status.should.not.equal(200);
                })
                .catch((err) => {
                    err.status.should.equal(404, 'Barcode that doesn\'t exits should return error');
                });
        });
    });
});
