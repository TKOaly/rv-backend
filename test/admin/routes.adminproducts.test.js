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
const productStore = require('../../src/db/productStore');

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

        it('POST /, returns created product on valid parametres', (done) => { 
            let product = {
                descr: 'body.descr',
                pgrpid: '21',
                weight: 500,
                barcode: '6411501656249',
                count: 12,
                buyprice: 50,
                sellprice: 150
            };

            chai.request(server)
                .post('/api/v1/admin/products')
                .send(product)
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    should.not.exist(err);
                    should.exist(res.body.product);
                    res.status.should.equal(201);
                    done();
                });
        });

        it('POST /, returns error on invalid barcode', (done) => { 
            let product = {
                descr: 'body.descr',
                pgrpid: '21',
                weight: 500,
                barcode: 'invalid',
                count: 12,
                buyprice: 50,
                sellprice: 150
            };

            chai.request(server)
                .post('/api/v1/admin/products')
                .send(product)
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    should.exist(err);
                    res.status.should.equal(400);
                    done();
                });
        });

        it('POST /, returns error on missing parametres', (done) => { 
            let product = {
                weight: 500,
                barcode: '4560000033333',
                count: 12,
                buyprice: 50,
                sellprice: 150
            };

            chai.request(server)
                .post('/api/v1/admin/products')
                .send(product)
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    should.exist(err)
                    res.status.should.equal(400);
                    done();
              
        it('Adding products to stock should work', async () => {
            const product = await productStore.findById(1750);

            return chai.request(server)
                .post('/api/v1/admin/products/product/1750')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    buyprice: 300,
                    sellprice: 350,
                    quantity: 50
                })
                .then(res => {
                    res.status.should.equal(200);
                    res.body.product_id.should.equal(1750);
                    res.body.buyprice.should.equal(300);
                    res.body.sellprice.should.equal(350);
                    res.body.quantity.should.equal(product.count + 50);
                })
                .catch(err => {
                    throw err;
                });
        });

        it('Adding nonexistent product to stock should not work', async () => {
            return chai.request(server)
                .post('/api/v1/admin/products/product/123456890')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    buyprice: 300,
                    sellprice: 350,
                    quantity: 50
                })
                .then(res => {
                    res.status.should.not.equal(200);
                })
                .catch(err => {
                    err.status.should.equal(404);
                    should.exist(err.response.body.error_code);
                    should.exist(err.response.body.message);
                });
        });

        it('Request with missing fields should be rejected', async () => {
            return chai.request(server)
                .post('/api/v1/admin/products/product/1750')
                .set('Authorization', 'Bearer ' + token)
                .send({})
                .then(res => {
                    res.status.should.not.equal(200);
                })
                .catch(err => {
                    err.status.should.equal(400);
                    should.exist(err.response.body.error_code);
                    should.exist(err.response.body.message);
                    should.exist(err.response.body.errors);
                });
        });
    });
});
