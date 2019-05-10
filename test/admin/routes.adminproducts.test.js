const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');
const productStore = require('../../src/db/productStore');

const token = jwt.sign(
    {
        username: 'admin_user'
    },
    process.env.JWT_ADMIN_SECRET
);

describe('routes: admin products', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('products', () => {
        it('admins should be able to get product list', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products')
                .set('Authorization', 'Bearer ' + token);

            expect(res.body.products).to.exist;
        });

        it('admins should not be able to get a product that does not exist', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/product/9999')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
        });

        it('admins should be able to get a product that exists', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/product/1816')
                .set('Authorization', 'Bearer ' + token);

            expect(res.body.product).to.exist;
            expect(res.body.product.itemid).to.exist;
            expect(res.body.product.pgrpid).to.exist;
            expect(res.body.product.descr).to.exist;
            expect(res.body.product.weight).to.exist;
            expect(res.body.product.priceid).to.exist;
            expect(res.body.product.barcode).to.exist;
            expect(res.body.product.count).to.exist;
            expect(res.body.product.buyprice).to.exist;
            expect(res.body.product.sellprice).to.exist;
        });

        it('admins should be able to edit a product that exists', async () => {
            const res = await chai
                .request(server)
                .put('/api/v1/admin/products/product/1816')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    descr: 'good product',
                    pgrpid: 3,
                    quantity: 450,
                    buyprice: 120,
                    sellprice: 200,
                    weight: 555
                });

            expect(res.body.product).to.exist;
            expect(res.body.product.itemid).to.exist;
            expect(res.body.product.pgrpid).to.exist;
            expect(res.body.product.count).to.exist;
            expect(res.body.product.sellprice).to.exist;
            expect(res.body.product.buyprice).to.exist;
            expect(res.body.product.weight).to.exist;
            expect(res.body.product.pgrpid).to.equal(3);
            expect(res.body.product.buyprice).to.equal(120);
            expect(res.body.product.sellprice).to.equal(200);
            expect(res.body.product.count).to.equal(450);
            expect(res.body.product.weight).to.equal(555);
        });

        it('Requesting product with existing barcode', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/5029578000972')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200, 'Existing barcode should return product');
            expect(res.body.product['barcode']).to.equal('5029578000972');
        });

        it('Requesting product with malformated barcode', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/1337')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404, 'malformated barcode should return error');
        });

        it('Requesting product with nonexisting barcode', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/1234567890123')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404, 'Barcode that doesn\'t exist should return error');
        });

        it('POST /, returns created product on valid parametres', async () => {
            const product = {
                descr: 'body.descr',
                pgrpid: 21,
                weight: 500,
                barcode: '6411501656247',
                count: 12,
                buyprice: 50,
                sellprice: 150
            };

            const res = await chai
                .request(server)
                .post('/api/v1/admin/products')
                .send(product)
                .set('Authorization', 'Bearer ' + token);

            expect(res.body.product).to.exist;
            expect(res.status).to.equal(201);
        });

        it('POST /, returns error on invalid barcode', async () => {
            const product = {
                descr: 'body.descr',
                pgrpid: 21,
                weight: 500,
                barcode: 'invalid',
                count: 12,
                buyprice: 50,
                sellprice: 150
            };

            const res = await chai
                .request(server)
                .post('/api/v1/admin/products')
                .send(product)
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(400);
        });

        it('POST /, returns error on missing parametres', async () => {
            const product = {
                weight: 500,
                barcode: '4560000033333',
                count: 12,
                buyprice: 50,
                sellprice: 150
            };

            const res = await chai
                .request(server)
                .post('/api/v1/admin/products')
                .send(product)
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(400);
        });

        it('Adding products to stock should work', async () => {
            const product = await productStore.findById(1750);

            const res = await chai
                .request(server)
                .post('/api/v1/admin/products/product/1750')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    buyprice: 300,
                    sellprice: 350,
                    quantity: 50
                });

            expect(res.status).to.equal(200);
            expect(res.body.product_id).to.equal(1750);
            expect(res.body.buyprice).to.equal(300);
            expect(res.body.sellprice).to.equal(350);
            expect(res.body.quantity).to.equal(product.count + 50);
        });

        it('Adding nonexistent product to stock should not work', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/products/product/123456890')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    buyprice: 300,
                    sellprice: 350,
                    quantity: 50
                });

            expect(res.status).to.equal(404);
            expect(res.body.error_code).to.exist;
            expect(res.body.message).to.exist;
        });

        it('Request with missing fields should be rejected', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/products/product/1750')
                .set('Authorization', 'Bearer ' + token)
                .send({});

            expect(res.status).to.equal(400);
            expect(res.body.error_code).to.exist;
            expect(res.body.message).to.exist;
            expect(res.body.errors).to.exist;
        });
    });
});
