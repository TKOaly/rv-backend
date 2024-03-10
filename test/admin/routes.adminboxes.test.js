const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

const server = require('../../src/app');
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');
const boxStore = require('../../src/db/boxStore');

chai.use(chaiHttp);

const token = jwt.sign({ userId: 2 }, process.env.JWT_ADMIN_SECRET);

describe('routes: admin boxes', () => {
	beforeEach(async () => {
		await knex.migrate.rollback();
		await knex.migrate.latest();
		await knex.seed.run();
	});

	afterEach(async () => {
		await knex.migrate.rollback();
	});

	describe('Fetching all boxes', () => {
		it('should return all boxes', async () => {
			const res = await chai.request(server).get('/api/v1/admin/boxes')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});
	});

	describe('Fetching box by barcode', () => {
		it('should return the box', async () => {
			const res = await chai.request(server).get(
				'/api/v1/admin/boxes/01766752',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});

		it('should return 404 on nonexistent box', async () => {
			const res = await chai.request(server).get(
				'/api/v1/admin/boxes/00000000',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
		});
	});

	describe('Creating new box', () => {
		it('should create new box', async () => {
			const res = await chai.request(server).post('/api/v1/admin/boxes')
				.set('Authorization', 'Bearer ' + token).send({
					boxBarcode: '12345678',
					itemsPerBox: 3,
					productBarcode: '6415600540889',
				});

			expect(res.status).to.equal(201);

			const newBox = await boxStore.findByBoxBarcode('12345678');
			expect(newBox).to.exist;
			expect(newBox.boxBarcode).to.equal('12345678');
			expect(newBox.itemsPerBox).to.equal(3);
			expect(newBox.product.barcode).to.equal('6415600540889');
		});

		it('should return the new box', async () => {
			const res = await chai.request(server).post('/api/v1/admin/boxes')
				.set('Authorization', 'Bearer ' + token).send({
					boxBarcode: '12345678',
					itemsPerBox: 3,
					productBarcode: '6415600540889',
				});

			expect(res.status).to.equal(201);
		});

		it('should error if box barcode is already taken', async () => {
			const res = await chai.request(server).post('/api/v1/admin/boxes')
				.set('Authorization', 'Bearer ' + token).send({
					boxBarcode: '01880335',
					itemsPerBox: 3,
					productBarcode: '6415600540889',
				});

			expect(res.status).to.equal(409);
			expect(res.body.error_code).to.equal('identifier_taken');
		});

		it('should error on nonexistent product', async () => {
			const res = await chai.request(server).post('/api/v1/admin/boxes')
				.set('Authorization', 'Bearer ' + token).send({
					boxBarcode: '12345678',
					itemsPerBox: 2,
					productBarcode: '00000000',
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('invalid_reference');
		});

		it('should error on invalid parameters', async () => {
			const res = await chai.request(server).post('/api/v1/admin/boxes')
				.set('Authorization', 'Bearer ' + token).send({
					boxBarcode: '',
					itemsPerBox: 2,
					productBarcode: '6415600540889',
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});
	});

	describe('Modifying box data', () => {
		it('should modify the box', async () => {
			const res = await chai.request(server).patch(
				'/api/v1/admin/boxes/01880335',
			).set('Authorization', 'Bearer ' + token).send({
				itemsPerBox: 6,
				productBarcode: '6415600540889',
			});

			expect(res.status).to.equal(200);

			const updatedBox = await boxStore.findByBoxBarcode('01880335');
			expect(updatedBox).to.exist;
			expect(updatedBox.itemsPerBox).to.equal(6);
			expect(updatedBox.product.barcode).to.equal('6415600540889');
		});

		it('should allow modifying only some fields', async () => {
			const res = await chai.request(server).patch(
				'/api/v1/admin/boxes/01880335',
			).set('Authorization', 'Bearer ' + token).send({
				productBarcode: '6415600540889',
			});

			expect(res.status).to.equal(200);

			const updatedBox = await boxStore.findByBoxBarcode('01880335');
			expect(updatedBox).to.exist;
			expect(updatedBox.product.barcode).to.equal('6415600540889');
		});

		it('should return the updated box', async () => {
			const res = await chai.request(server).patch(
				'/api/v1/admin/boxes/01880335',
			).set('Authorization', 'Bearer ' + token).send({
				itemsPerBox: 49,
				productBarcode: '6415600540889',
			});

			expect(res.status).to.equal(200);
		});

		it('should error on nonexistent box', async () => {
			const res = await chai.request(server).patch(
				'/api/v1/admin/boxes/88888888',
			).set('Authorization', 'Bearer ' + token).send({
				itemsPerBox: 3,
				productBarcode: '6415600540889',
			});

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should error on nonexistent product', async () => {
			const res = await chai.request(server).patch(
				'/api/v1/admin/boxes/01880335',
			).set('Authorization', 'Bearer ' + token).send({
				itemsPerBox: 6,
				productBarcode: '55555555',
			});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('invalid_reference');
		});

		it('should error on invalid parameters', async () => {
			const res = await chai.request(server).patch(
				'/api/v1/admin/boxes/01880335',
			).set('Authorization', 'Bearer ' + token).send({
				itemsPerBox: -1,
				productBarcode: '6415600540889',
			});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});
	});

	describe('Deleting a box', () => {
		it('should delete the box', async () => {
			let res = await chai.request(server).delete(
				'/api/v1/admin/boxes/01880335',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);

			res = await chai.request(server).get('/api/v1/admin/boxes/01880335')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
		});

		it('should error on nonexistent box', async () => {
			const res = await chai.request(server).delete(
				'/api/v1/admin/boxes/88888888',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should return the deleted box', async () => {
			const res = await chai.request(server).delete(
				'/api/v1/admin/boxes/01880335',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});
	});

	describe('Buy-in of boxes', () => {
		it('should fail on nonexisting boxes', async () => {
			const res = await chai.request(server).post(
				'/api/v1/admin/boxes/88888888/buyIn',
			).set('Authorization', 'Bearer ' + token).send({
				boxCount: 1,
				productBuyPrice: 1,
				productSellPrice: 1,
			});

			expect(res.status).to.equal(404);
		});

		it('should fail on invalid request', async () => {
			const validFields = {
				boxCount: 1,
				productBuyPrice: 1,
				productSellPrice: 1,
			};

			for (const missingField in validFields) {
				const invalidRequest = { ...validFields };
				delete invalidRequest[missingField];

				const res = await chai.request(server).post(
					'/api/v1/admin/boxes/01880335/buyIn',
				).set('Authorization', 'Bearer ' + token).send(invalidRequest);

				expect(res.status).to.equal(
					400,
					`request should fail when field ${missingField} is not defined`,
				);
			}

			for (const negativeField in validFields) {
				const invalidRequest = { ...validFields };
				invalidRequest[negativeField] = -1;

				const res = await chai.request(server).post(
					'/api/v1/admin/boxes/01880335/buyIn',
				).set('Authorization', 'Bearer ' + token).send(invalidRequest);

				expect(res.status).to.equal(
					400,
					`request should fail when field ${negativeField} is negative`,
				);
			}
		});

		it('should update the number of items', async () => {
			const initial_res = await chai.request(server).get(
				'/api/v1/admin/boxes/01880335',
			).set('Authorization', 'Bearer ' + token);

			expect(initial_res.status).to.equal(200);

			const { buyPrice, sellPrice, stock } = initial_res.body.box.product;
			const itemsPerBox = initial_res.body.box.itemsPerBox;

			const res = await chai.request(server).post(
				'/api/v1/admin/boxes/01880335/buyIn',
			).set('Authorization', 'Bearer ' + token).send({
				boxCount: 1,
				productBuyPrice: buyPrice,
				productSellPrice: sellPrice,
			});

			expect(res.status).to.equal(200);
			expect(res.body.productStock).to.equal(stock + itemsPerBox);

			const post_res = await chai.request(server).get(
				'/api/v1/admin/boxes/01880335',
			).set('Authorization', 'Bearer ' + token);

			expect(post_res.status).to.equal(200);
			expect(post_res.body.box.product.stock).to.equal(
				stock + itemsPerBox,
			);
		});

		it('should update the sell and buy prices of the product', async () => {
			const initial_res = await chai.request(server).get(
				'/api/v1/admin/boxes/01880335',
			).set('Authorization', 'Bearer ' + token);

			expect(initial_res.status).to.equal(200);

			const { buyPrice, sellPrice } = initial_res.body.box.product;

			const res = await chai.request(server).post(
				'/api/v1/admin/boxes/01880335/buyIn',
			).set('Authorization', 'Bearer ' + token).send({
				boxCount: 1,
				productBuyPrice: buyPrice + 1,
				productSellPrice: sellPrice + 1,
			});

			expect(res.status).to.equal(200);

			const post_res = await chai.request(server).get(
				'/api/v1/admin/boxes/01880335',
			).set('Authorization', 'Bearer ' + token);

			expect(post_res.status).to.equal(200);
			expect(post_res.body.box.product.sellPrice).to.equal(
				sellPrice + 1,
				'product\'s sellPrice should have changed',
			);
			expect(post_res.body.box.product.buyPrice).to.equal(
				buyPrice + 1,
				'product\'s buyPrice should have changed',
			);
		});
	});
});
