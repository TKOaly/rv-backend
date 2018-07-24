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
const boxStore = require('../../src/db/boxStore');
const productStore = require('../../src/db/productStore');

describe('routes: admin boxes', () => {
    const server = require('../../src/app');
    const request = chai.request(server);
    const token = jwt.sign({ username: 'admin_user' }, process.env.JWT_ADMIN_SECRET);

    beforeEach(async function() {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async function() {
        await knex.migrate.rollback();
    });

    it('GET /api/v1/admin/boxes should return a list of boxes', async () => {
        return chai
            .request(server)
            .get('/api/v1/admin/boxes')
            .set('Authorization', 'Bearer ' + token)
            .then((res) => {
                res.status.should.equal(200);
                res.body.should.be.an('object');
                res.body.should.include.keys('boxes');
                res.body.boxes.every((box) => {
                    box.should.include.keys(
                        'box_barcode',
                        'product_barcode',
                        'product_name',
                        'items_per_box',
                        'product_id'
                    );
                });
            });
    });

    it('GET /api/v1/admin/boxes/:barcode should return a known box', async () => {
        return chai
            .request(server)
            .get('/api/v1/admin/boxes/01766756')
            .set('Authorization', 'Bearer ' + token)
            .then((res) => {
                res.status.should.equal(200);
                res.body.should.be.an('object');
                res.body.should.include.keys('box');
                res.body.box.should.include.keys(
                    'box_barcode',
                    'product_barcode',
                    'product_name',
                    'items_per_box',
                    'product_id'
                );
            });
    });

    it('GET /api/v1/admin/boxes/:barcode should return 404 with an unknown box', async () => {
        return chai
            .request(server)
            .get('/api/v1/admin/boxes/00000000')
            .set('Authorization', 'Bearer ' + token)
            .then((res) => {
                res.status.should.not.equal(200);
            })
            .catch((err) => {
                err.status.should.equal(404);
            });
    });

    it('POST /api/v1/admin/boxes/:barcode should add boxes of products correctly', async () => {
        const box = await boxStore.findByBoxBarcode('00101010');
        const product = await productStore.findById(box.product_id);

        return chai
            .request(server)
            .post('/api/v1/admin/boxes/' + box.box_barcode)
            .send({
                boxes: 2,
                buyprice: 350,
                sellprice: 390
            })
            .set('Authorization', 'Bearer ' + token)
            .then((res) => {
                res.status.should.equal(200);
                res.body.should.be.an('object');

                const response = res.body;
                response.should.include.keys(
                    'box_barcode',
                    'product_barcode',
                    'product_name',
                    'product_id',
                    'quantity_added',
                    'total_quantity'
                );

                response.box_barcode.should.equal(box.box_barcode);
                response.product_barcode.should.equal(box.product_barcode);
                response.product_name.should.equal(product.descr);

                const expectedQty = box.items_per_box * 2;
                response.quantity_added.should.equal(expectedQty);
                response.total_quantity.should.equal(product.count + expectedQty);
            });
    });

    it('PUT /api/v1/admin/boxes/:barcode should create a new box', async () => {
        const reqData = {
            items_per_box: 12,
            product: {
                product_barcode: '8855702006834',
                product_name: 'Thai-Cube Sweet and Sour Chicken',
                product_group: 1,
                product_weight: 350,
                product_buyprice: 380,
                product_sellprice: 380
            }
        };

        return chai
            .request(server)
            .put('/api/v1/admin/boxes/01020304')
            .send(reqData)
            .set('Authorization', 'Bearer ' + token)
            .then((res) => {
                res.status.should.equal(201);
                res.body.should.be.an('object');
                res.body.should.include.all.keys('box_barcode', 'items_per_box', 'product');

                const box = res.body;
                box.box_barcode.should.equal('01020304');
                box.items_per_box.should.equal(reqData.items_per_box);
                should.exist(box.product.product_id);

                const expectedProduct = Object.assign({}, reqData.product, {
                    product_id: box.product.product_id
                });
                box.product.should.deep.equal(expectedProduct);
            });
    });

    it('PUT /api/v1/admin/boxes/:barcode should update an existing box', async () => {
        const reqData = {
            items_per_box: 15,
            product: {
                product_barcode: '8855702006834',
                product_name: 'Thai-Cube Sweet and Sour Chicken',
                product_group: 1,
                product_weight: 350,
                product_buyprice: 380,
                product_sellprice: 380
            }
        };

        return chai
            .request(server)
            .put('/api/v1/admin/boxes/00101010')
            .send(reqData)
            .set('Authorization', 'Bearer ' + token)
            .then((res) => {
                res.status.should.equal(200);
                res.body.should.be.an('object');
                res.body.should.include.all.keys('box_barcode', 'items_per_box', 'product');

                const box = res.body;
                box.box_barcode.should.equal('00101010');
                box.items_per_box.should.equal(reqData.items_per_box);
                should.exist(box.product.product_id);

                const expectedProduct = Object.assign({}, reqData.product, {
                    product_id: box.product.product_id
                });
                box.product.should.deep.equal(expectedProduct);
            });
    });

    it('PUT /api/v1/admin/boxes/:barcode should create a product if it doesn\'t exist', async () => {
        const reqData = {
            items_per_box: 37,
            product: {
                product_barcode: '00112233',
                product_name: 'Test product 5000',
                product_group: 1,
                product_weight: 5000,
                product_buyprice: 50,
                product_sellprice: 50
            }
        };

        return chai
            .request(server)
            .put('/api/v1/admin/boxes/00101010')
            .send(reqData)
            .set('Authorization', 'Bearer ' + token)
            .then((res) => {
                res.status.should.equal(200);
                res.body.should.be.an('object');
                res.body.should.include.all.keys('box_barcode', 'items_per_box', 'product');

                const box = res.body;
                box.box_barcode.should.equal('00101010');
                box.items_per_box.should.equal(reqData.items_per_box);
                should.exist(box.product.product_id);

                const expectedProduct = Object.assign({}, reqData.product, {
                    product_id: box.product.product_id
                });
                box.product.should.deep.equal(expectedProduct);
            });
    });
});
