process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test secret';

const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../src/app');
const request = chai.request(server);
const knex = require('../src/db/knex');
const jwt = require('../src/jwt/token');

const token = jwt.sign({
    username: 'normal_user'
});

describe('routes: userPurchaseHistory', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Fetching user purchase history', () => {
        it('should return user purchase history', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/user/purchaseHistory')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('purchases');
            expect(res.body.purchases).to.be.an('array');
            for (const purchase of res.body.purchases) {
                expect(purchase).to.have.all.keys('purchaseId', 'time', 'product', 'price', 'balanceAfter');
                expect(purchase.product).to.have.all.keys('barcode', 'productId', 'name', 'category', 'weight');
                expect(purchase.product.category).to.have.all.keys('categoryId', 'description');
            }
        });
    });

    describe('Fetching single purchase by id', () => {
        it('should return the purchase event', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/user/purchaseHistory/2')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('purchase');
            expect(res.body.purchase).to.have.all.keys('purchaseId', 'time', 'product', 'price', 'balanceAfter');
            expect(res.body.purchase.product).to.have.all.keys('barcode', 'productId', 'name', 'category', 'weight');
            expect(res.body.purchase.product.category).to.have.all.keys('categoryId', 'description');
        });

        it('should return 404 on nonexistent purchase event', async () => {
            try {
                const res = await chai
                    .request(server)
                    .get('/api/v1/user/purchaseHistory/8319')
                    .set('Authorization', 'Bearer ' + token);

                expect(res).to.not.exist;
            } catch (err) {
                expect(err.status).to.equal(404);
            }
        });

        it('should have the time as string in ISO 8601 format', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/user/purchaseHistory/2')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body.purchase.time).to.equal('2018-12-24T00:00:01.000Z');
        });
    });
});
