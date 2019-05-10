process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test secret';

const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../src/app');
const knex = require('../src/db/knex.js');
const jwt = require('../src/jwt/token');
const userStore = require('../src/db/userStore');
const productStore = require('../src/db/productStore');
const historyStore = require('../src/db/historyStore');

const token = jwt.sign({
    username: 'normal_user'
});

describe('routes: products', () => {
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
                .get('/api/v1/products')
                .set('Authorization', 'Bearer ' + token);

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
        });
    });

    describe('Fetching product by barcode', () => {
        it('should return the product', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/products/5053990127443')
                .set('Authorization', 'Bearer ' + token);

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
        });

        it('should return 404 on nonexistent product', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/products/99999995')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
        });
    });

    describe('Purchasing product', () => {
        it('should deduct account balance and product stock', async () => {
            const oldUser = await userStore.findByUsername('normal_user');
            const oldProduct = await productStore.findByBarcode('8855702006834');

            const res = await chai
                .request(server)
                .post('/api/v1/products/8855702006834/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 1
                });

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('accountBalance', 'productStock');

            const newUser = await userStore.findByUsername('normal_user');
            const newProduct = await productStore.findByBarcode('8855702006834');

            expect(newUser.saldo).to.equal(oldUser.saldo - oldProduct.sellprice);
            expect(newUser.saldo).to.equal(res.body.accountBalance);

            expect(newProduct.count).to.equal(oldProduct.count - 1);
            expect(newProduct.count).to.equal(res.body.productStock);
        });

        it('should create an event into purchase history', async () => {
            const user = await userStore.findByUsername('normal_user');
            const oldPurchaseHistory = await historyStore.getUserPurchaseHistory(user.userid);

            const res = await chai
                .request(server)
                .post('/api/v1/products/6417901011105/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 1
                });

            expect(res.status).to.equal(200);

            const newPurchaseHistory = await historyStore.getUserPurchaseHistory(user.userid);

            expect(newPurchaseHistory.length).to.equal(oldPurchaseHistory.length + 1);

            const purchaseEvent = newPurchaseHistory[0];

            expect(purchaseEvent.barcode).to.equal('6417901011105');
            expect(purchaseEvent.saldo).to.equal(res.body.accountBalance);
        });

        it('should create multiple history events on multibuy', async () => {
            const user = await userStore.findByUsername('normal_user');
            const oldPurchaseHistory = await historyStore.getUserPurchaseHistory(user.userid);

            const res = await chai
                .request(server)
                .post('/api/v1/products/6417901011105/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 3
                });

            expect(res.status).to.equal(200);

            const newPurchaseHistory = await historyStore.getUserPurchaseHistory(user.userid);

            expect(newPurchaseHistory.length).to.equal(oldPurchaseHistory.length + 3);
        });

        it('should return 404 on nonexistent product', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/products/1234567890123/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 1
                });

            expect(res.status).to.equal(404);
        });

        it('should error on insufficient funds', async () => {
            const user = await userStore.findByUsername('normal_user');
            await userStore.updateAccountBalance(user.userid, 0);

            const res = await chai
                .request(server)
                .post('/api/v1/products/8855702006834/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    count: 1
                });

            expect(res.body.error_code).to.equal('insufficient_funds');
        });
    });
});
