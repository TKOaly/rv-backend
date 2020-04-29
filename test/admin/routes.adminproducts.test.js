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
});
