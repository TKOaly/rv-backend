process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test secret';

const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../src/app');
const request = chai.request(server);
const knex = require('../src/db/knex.js');
const jwt = require('../src/jwt/token');

const token = jwt.sign({
    username: 'normal_user'
});

describe('routes: products', () => {
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

    describe('Fetching all products', () => {
        it('should return all products', (done) => {
            chai.request(server)
                .get('/api/v1/products')
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    expect(err).to.not.exist;
                    expect(res.status).to.equal(200);

                    expect(res.body).to.have.all.keys('products');
                    expect(res.body.products).to.be.an('array');
                    for (const product of res.body.products) {
                        expect(product).to.have.all.keys(
                            'barcode',
                            'productId',
                            'name',
                            'category',
                            'weight',
                            'sellPrice',
                            'stock'
                        );
                        expect(product.category).to.have.all.keys('categoryId', 'description');
                    }

                    done();
                });
        });
    });

    describe('Fetching product by barcode', () => {
        it('should return the product', (done) => {
            chai.request(server)
                .get('/api/v1/products/5053990127443')
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    expect(err).to.not.exist;
                    expect(res.status).to.equal(200);

                    expect(res.body).to.have.all.keys('product');
                    expect(res.body.product).to.have.all.keys(
                        'barcode',
                        'productId',
                        'name',
                        'category',
                        'weight',
                        'sellPrice',
                        'stock'
                    );
                    expect(res.body.product.category).to.have.all.keys('categoryId', 'description');

                    done();
                });
        });

        it('should return 404 on nonexistent product', (done) => {
            chai.request(server)
                .get('/api/v1/products/99999995')
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    expect(err).to.exist;
                    expect(res.status).to.equal(404);

                    done();
                });
        });
    });
});
