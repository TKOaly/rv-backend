const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');
const boxStore = require('../../src/db/boxStore');
const productStore = require('../../src/db/productStore');

const token = jwt.sign(
    {
        username: 'admin_user'
    },
    process.env.JWT_ADMIN_SECRET
);

describe('routes: admin boxes', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Admin boxes', () => {
        it('GET /api/v1/admin/boxes should return a list of boxes', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/boxes')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.include.keys('boxes');
            res.body.boxes.every((box) => {
                expect(box).to.include.keys(
                    'box_barcode',
                    'product_barcode',
                    'product_name',
                    'items_per_box',
                    'product_id'
                );
            });
        });

        it('GET /api/v1/admin/boxes/:barcode should return a known box', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/boxes/01766752')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.include.keys('box');
            expect(res.body.box).to.include.keys(
                'box_barcode',
                'product_barcode',
                'product_name',
                'items_per_box',
                'product_id'
            );
        });

        it('GET /api/v1/admin/boxes/:barcode should return 404 with an unknown box', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/boxes/00000000')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
        });

        it('POST /api/v1/admin/boxes/:barcode should add boxes of products correctly', async () => {
            const box = await boxStore.findByBoxBarcode('00101011');
            const product = await productStore.findById(box.product_id);

            const res = await chai
                .request(server)
                .post('/api/v1/admin/boxes/' + box.box_barcode)
                .send({
                    boxes: 2,
                    buyprice: 350,
                    sellprice: 390
                })
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('object');

            const response = res.body;
            expect(response).to.include.keys(
                'box_barcode',
                'product_barcode',
                'product_name',
                'product_id',
                'quantity_added',
                'total_quantity'
            );

            expect(response.box_barcode).to.equal(box.box_barcode);
            expect(response.product_barcode).to.equal(box.product_barcode);
            expect(response.product_name).to.equal(product.descr);

            const expectedQty = box.items_per_box * 2;
            expect(response.quantity_added).to.equal(expectedQty);
            expect(response.total_quantity).to.equal(product.count + expectedQty);
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

            const res = await chai
                .request(server)
                .put('/api/v1/admin/boxes/01020304')
                .send(reqData)
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.include.all.keys('box_barcode', 'items_per_box', 'product');

            const box = res.body;
            expect(box.box_barcode).to.equal('01020304');
            expect(box.items_per_box).to.equal(reqData.items_per_box);
            expect(box.product.product_id).to.exist;

            const expectedProduct = Object.assign({}, reqData.product, {
                product_id: box.product.product_id
            });
            expect(box.product).to.deep.equal(expectedProduct);
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

            const res = await chai
                .request(server)
                .put('/api/v1/admin/boxes/00101011')
                .send(reqData)
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.include.all.keys('box_barcode', 'items_per_box', 'product');

            const box = res.body;
            expect(box.box_barcode).to.equal('00101011');
            expect(box.items_per_box).to.equal(reqData.items_per_box);
            expect(box.product.product_id).to.exist;

            const expectedProduct = Object.assign({}, reqData.product, {
                product_id: box.product.product_id
            });
            expect(box.product).to.deep.equal(expectedProduct);
        });

        it('PUT /api/v1/admin/boxes/:barcode should create a product if it doesn\'t exist', async () => {
            const reqData = {
                items_per_box: 37,
                product: {
                    product_barcode: '00112239',
                    product_name: 'Test product 5000',
                    product_group: 1,
                    product_weight: 5000,
                    product_buyprice: 50,
                    product_sellprice: 50
                }
            };

            const res = await chai
                .request(server)
                .put('/api/v1/admin/boxes/00101011')
                .send(reqData)
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.include.all.keys('box_barcode', 'items_per_box', 'product');

            const box = res.body;
            expect(box.box_barcode).to.equal('00101011');
            expect(box.items_per_box).to.equal(reqData.items_per_box);
            expect(box.product.product_id).to.exist;

            const expectedProduct = Object.assign({}, reqData.product, {
                product_id: box.product.product_id
            });
            expect(box.product).to.deep.equal(expectedProduct);
        });
    });
});
