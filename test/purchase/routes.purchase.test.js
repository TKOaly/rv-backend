const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const request = chai.request(server);
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');
const userStore = require('../../src/db/userStore');
const productStore = require('../../src/db/productStore');

describe('routes: purchase', () => {
    beforeEach(async function() {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async function() {
        await knex.migrate.rollback();
    });

    describe('Purchasing products', () => {
        const token = jwt.sign({ username: 'normal_user' });

        it('purchasing a valid product should deduct account balance', async () => {
            const oldUser = await userStore.findByUsername('normal_user');
            const product = await productStore.findByBarcode('8855702006834');

            return chai.request(server)
                .post('/api/v1/product/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    barcode: '8855702006834',
                    quantity: 1
                })
                .then((res) => {
                    res.status.should.equal(200, 'valid purchase should return a 200 response');
                    res.body.product_name.should.equal('Thai-Cube Sweet and Sour Chicken');
                    res.body.quantity.should.equal(1, 'Expected quantity to equal 1');

                    return userStore.findByUsername('normal_user')
                        .then((newUser) => {
                            newUser.saldo.should.equal(
                                oldUser.saldo - product.sellprice,
                                'Product price should be deducted from user\'s account balance'
                            );
                        });
                })
                .catch((err) => {
                    throw err;
                });
        });

        it('purchasing a nonexistent product should not work', async () => {
            return chai.request(server)
                .post('/api/v1/product/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    barcode: '123456789012',
                    quantity: 1
                })
                .then((res) => {
                    res.should.not.equal(200);
                })
                .catch((err) => {
                    err.status.should.equal(404, 'trying to purchase a nonexistent product should result in 404');
                });
        });

        it('trying to purchase without enough money should not work', async () => {
            await userStore.updateAccountBalance('normal_user', -500);

            return chai.request(server)
                .post('/api/v1/product/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    barcode: '8855702006834',
                    quantity: 1
                })
                .then((res) => {
                    res.should.not.equal(200);
                })
                .catch((err) => {
                    err.status.should.equal(403, 'trying to purchase without money should result in 403');
                });
        });

        it('missing fields should result in a 400 response', async () => {
            await userStore.updateAccountBalance('normal_user', -500);

            return chai.request(server)
                .post('/api/v1/product/purchase')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    barcode: '8855702006834'
                })
                .then((res) => {
                    res.should.not.equal(200);
                })
                .catch((err) => {
                    err.status.should.equal(400);
                });
        });
    });
});