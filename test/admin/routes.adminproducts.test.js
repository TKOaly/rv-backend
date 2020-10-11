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
        userId: 2
    },
    process.env.JWT_ADMIN_SECRET
);

const normalUserToken = jwt.sign(
    {
        userId: 1
    },
    process.env.JWT_SECRET
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

    describe('Fetching all products', () => {
        it('should return all products', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('products');
            expect(res.body.products).to.be.an('array');
            for (const product of res.body.products) {
                expect(product).to.have.all.keys(
                    'barcode',
                    'name',
                    'category',
                    'weight',
                    'buyPrice',
                    'sellPrice',
                    'stock'
                );
                expect(product.category).to.have.all.keys('categoryId', 'description');
            }
        });
    });

    describe('Fetching product by barcode', () => {
        it('should return the product', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('product');
            expect(res.body.product).to.have.all.keys(
                'barcode',
                'name',
                'category',
                'weight',
                'buyPrice',
                'sellPrice',
                'stock'
            );
            expect(res.body.product.category).to.have.all.keys('categoryId', 'description');
        });

        it('should error on nonexistent product', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/products/666')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
        });
    });

    describe('Creating new product', () => {
        it('should create new product', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/products')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    barcode: '575757575757',
                    name: 'Opossumin lihaa',
                    categoryId: 24,
                    weight: 500,
                    buyPrice: 367,
                    sellPrice: 370,
                    stock: 1
                });

            expect(res.status).to.equal(201);

            const newProduct = await productStore.findByBarcode('575757575757');
            expect(newProduct).to.exist;
            expect(newProduct.barcode).to.equal('575757575757');
            expect(newProduct.name).to.equal('Opossumin lihaa');
            expect(newProduct.category.categoryId).to.equal(24);
        });

        it('should return the new product', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/products')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    barcode: '575757575757',
                    name: 'Opossumin lihaa',
                    categoryId: 24,
                    weight: 500,
                    buyPrice: 367,
                    sellPrice: 370,
                    stock: 1
                });

            expect(res.status).to.equal(201);

            expect(res.body).to.have.all.keys('product');
            expect(res.body.product).to.have.all.keys(
                'barcode',
                'name',
                'category',
                'weight',
                'buyPrice',
                'sellPrice',
                'stock'
            );
            expect(res.body.product.category).to.have.all.keys('categoryId', 'description');
        });

        it('should error if barcode is already taken', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/products')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    barcode: '5053990123506',
                    name: 'Opossumin lihaa',
                    categoryId: 24,
                    weight: 500,
                    buyPrice: 367,
                    sellPrice: 370,
                    stock: 1
                });

            expect(res.status).to.equal(409);
            expect(res.body.error_code).to.equal('identifier_taken');
        });

        it('should error on nonexistent category', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/products')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    barcode: '575757575757',
                    name: 'Opossumin lihaa',
                    categoryId: 11111,
                    weight: 500,
                    buyPrice: 367,
                    sellPrice: 370,
                    stock: 1
                });

            expect(res.status).to.equal(400);
            expect(res.body.error_code).to.equal('invalid_reference');
        });

        it('should error on invalid parameters', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/products')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    barcode: '575757575757',
                    name: 'Opossumin lihaa',
                    categoryId: 11111,
                    stock: 1
                });

            expect(res.status).to.equal(400);
            expect(res.body.error_code).to.equal('bad_request');
        });
    });

    describe('Modifying product data', () => {
        it('should modify the product', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    name: 'Koalan lihaa',
                    categoryId: 24,
                    weight: 500,
                    buyPrice: 367,
                    sellPrice: 370,
                    stock: 1
                });

            expect(res.status).to.equal(200);

            const updatedProduct = await productStore.findByBarcode('5053990123506');
            expect(updatedProduct).to.exist;
            expect(updatedProduct.name).to.equal('Koalan lihaa');
            expect(updatedProduct.category.categoryId).to.equal(24);
        });

        it('should allow modifying only some fields', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    buyPrice: 5000
                });

            expect(res.status).to.equal(200);

            const updatedProduct = await productStore.findByBarcode('5053990123506');
            expect(updatedProduct).to.exist;
            expect(updatedProduct.buyPrice).to.equal(5000);
        });

        it('should return the updated product', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    buyPrice: 5000
                });

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('product');
            expect(res.body.product).to.have.all.keys(
                'barcode',
                'name',
                'category',
                'weight',
                'buyPrice',
                'sellPrice',
                'stock'
            );
            expect(res.body.product.category).to.have.all.keys('categoryId', 'description');
            expect(res.body.product.buyPrice).to.equal(5000);
        });

        it('should error on nonexistent product', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/products/88888888')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    buyPrice: 5000
                });

            expect(res.status).to.equal(404);
            expect(res.body.error_code).to.equal('not_found');
        });

        it('should error on nonexistent category', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    categoryId: 999
                });

            expect(res.status).to.equal(400);
            expect(res.body.error_code).to.equal('invalid_reference');
        });

        it('should error on invalid parameters', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    aaa: 4
                });

            expect(res.status).to.equal(400);
            expect(res.body.error_code).to.equal('bad_request');
        });
    });

    describe('Deleting a product', () => {
        it('should fail on nonexisting product', async () => {
            const res = await chai
                .request(server)
                .delete('/api/v1/admin/products/88888888')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
            expect(res.body.error_code).to.equal('not_found');
        });

        it('should return the deleted product', async () => {
            const res = await chai
                .request(server)
                .delete('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('deletedProduct');
            expect(res.body.deletedProduct).to.have.all.keys(
                'barcode',
                'name',
                'category',
                'weight',
                'buyPrice',
                'sellPrice',
                'stock'
            );
            expect(res.body.deletedProduct.category).to.have.all.keys('categoryId', 'description');
        });

        it('should cause any requests for that product\'s information to fail', async () => {
            const res = await chai
                .request(server)
                .delete('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            const lookup = await chai
                .request(server)
                .get('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token);

            expect(lookup.status).to.equal(404);
            expect(lookup.body.error_code).to.equal('product_not_found');
        });

        it('should cause the item to be removed from item listing', async () => {
            const res = await chai
                .request(server)
                .delete('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            const listing = await chai
                .request(server)
                .get('/api/v1/admin/products')
                .set('Authorization', 'Bearer ' + token);

            expect(listing.body.products.find((item) => item.barcode === '5053990123506')).to.be.an('undefined');
        });

        it('should prevent the item from being purchased', async () => {
            const res = await chai
                .request(server)
                .delete('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            const purchase = await chai
                .request(server)
                .post('/api/v1/products/5053990123506/purchase')
                .set('Authorization', 'Bearer ' + normalUserToken)
                .send({
                    count: 1
                });

            expect(purchase.status).to.equal(404);
        });
    });

    describe('Buy-in of a product', () => {
        it('should fail on nonexisting products', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/products/88888888/buyIn')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 1,
                    buyPrice: 1,
                    sellPrice: 1
                });

            expect(res.status).to.equal(404);
            expect(res.body.error_code).to.equal('not_found');
        });

        it('should fail on invalid request', async () => {
            const validRequest = {
                count: 1,
                buyPrice: 1,
                sellPrice: 1
            };

            for (const missingField in validRequest) {
                const invalidRequest = { ...validRequest };
                delete invalidRequest[missingField];

                const res = await chai
                    .request(server)
                    .post('/api/v1/admin/products/5053990123506/buyIn')
                    .set('Authorization', 'Bearer ' + token)
                    .send(invalidRequest);

                expect(res.status).to.equal(400, `request should fail when field ${missingField} is not defined`);
            }

            for (const negativeField in validRequest) {
                const invalidRequest = { ...validRequest };
                invalidRequest[negativeField] = -1;

                const res = await chai
                    .request(server)
                    .post('/api/v1/admin/products/5053990123506/buyIn')
                    .set('Authorization', 'Bearer ' + token)
                    .send(invalidRequest);

                expect(res.status).to.equal(400, `request should fail when field ${negativeField} has a negative value`);
            }
        });

        it('should change the number of products in stock', async () => {
            const pre_query = await chai
                .request(server)
                .get('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token);

            expect(pre_query.status).to.equal(200);
            const initial_stock = pre_query.body.product.stock;

            const res = await chai
                .request(server)
                .post('/api/v1/admin/products/5053990123506/buyIn')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 1,
                    buyPrice: 1,
                    sellPrice: 1
                });

            expect(res.status).to.equal(200);

            const post_query = await chai
                .request(server)
                .get('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token);

            expect(post_query.status).to.equal(200);
            expect(post_query.body.product.stock).to.equal(initial_stock + 1);
        });

        it('should change the item\'s buyPrice and sellPrice', async () => {
            const pre_query = await chai
                .request(server)
                .get('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token);

            expect(pre_query.status).to.equal(200);
            const { buyPrice: initialBuyPrice, sellPrice: initialSellPrice } = pre_query.body.product;

            const res = await chai
                .request(server)
                .post('/api/v1/admin/products/5053990123506/buyIn')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 1,
                    buyPrice: initialBuyPrice + 1,
                    sellPrice: initialSellPrice + 1
                });

            expect(res.status).to.equal(200);

            const post_query = await chai
                .request(server)
                .get('/api/v1/admin/products/5053990123506')
                .set('Authorization', 'Bearer ' + token);

            expect(post_query.status).to.equal(200);
            expect(post_query.body.product.sellPrice).to.equal(initialSellPrice + 1);
            expect(post_query.body.product.buyPrice).to.equal(initialBuyPrice + 1);
        });
    });
});
