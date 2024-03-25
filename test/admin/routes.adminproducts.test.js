import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../src/app.js';
import knex, { test_teardown } from '../../src/db/knex.js';
import productStore from '../../src/db/productStore.js';
import jwt from '../../src/jwt/token.js';

import { after, afterEach, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

const adminToken = jwt.sign(
	{
		userId: 2,
	},
	process.env.JWT_ADMIN_SECRET
);
const userToken = jwt.sign({
	userId: 1,
});

after(async () => {
	await test_teardown();
});

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
				.request(app)
				.get('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + userToken);

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Fetching product by barcode', () => {
		it('should return the product', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);
		});

		it('should error on nonexistent product', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/products/666')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(404);
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + userToken);

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Creating new product', () => {
		it('should create new product', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					barcode: '575757575757',
					name: 'Opossumin lihaa',
					categoryId: 24,
					buyPrice: 367,
					sellPrice: 370,
					stock: 1,
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
				.request(app)
				.post('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					barcode: '575757575757',
					name: 'Opossumin lihaa',
					categoryId: 24,
					buyPrice: 367,
					sellPrice: 370,
					stock: 1,
				});

			expect(res.status).to.equal(201);
		});

		it('should error if barcode is already taken', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					barcode: '5053990123506',
					name: 'Opossumin lihaa',
					categoryId: 24,
					buyPrice: 367,
					sellPrice: 370,
					stock: 1,
				});

			expect(res.status).to.equal(409);

			expect(res.body.error_code).to.equal('identifier_taken');
		});

		it('should error on nonexistent category', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					barcode: '575757575757',
					name: 'Opossumin lihaa',
					categoryId: 11111,
					buyPrice: 367,
					sellPrice: 370,
					stock: 1,
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('invalid_reference');
		});

		it('should error on invalid parameters', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					barcode: '575757575757',
					name: 'Opossumin lihaa',
					categoryId: 11111,
					stock: 1,
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + userToken)
				.send({
					barcode: '575757575757',
					name: 'Opossumin lihaa',
					categoryId: 24,
					buyPrice: 367,
					sellPrice: 370,
					stock: 1,
				});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Modifying product data', () => {
		it('should modify the product', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					name: 'Koalan lihaa',
					categoryId: 24,
					buyPrice: 367,
					sellPrice: 370,
					stock: 1,
				});

			expect(res.status).to.equal(200);

			const updatedProduct = await productStore.findByBarcode('5053990123506');
			expect(updatedProduct).to.exist;
			expect(updatedProduct.name).to.equal('Koalan lihaa');
			expect(updatedProduct.category.categoryId).to.equal(24);
		});

		it('should allow modifying only some fields', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					buyPrice: 5000,
				});

			expect(res.status).to.equal(200);

			const updatedProduct = await productStore.findByBarcode('5053990123506');
			expect(updatedProduct).to.exist;
			expect(updatedProduct.buyPrice).to.equal(5000);
		});

		it('should return the updated product', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					buyPrice: 5000,
				});

			expect(res.status).to.equal(200);
		});

		it('should error on nonexistent product', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/products/88888888')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					buyPrice: 5000,
				});

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should error on nonexistent category', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					categoryId: 999,
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('invalid_reference');
		});

		it('should error on invalid parameters', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					aaa: 4,
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + userToken)
				.send({
					name: 'Koalan lihaa',
					categoryId: 24,
					buyPrice: 367,
					sellPrice: 370,
					stock: 1,
				});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Deleting a product', () => {
		it('should fail on nonexisting product', async () => {
			const res = await chai
				.request(app)
				.delete('/api/v1/admin/products/88888888')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should return the deleted product', async () => {
			const res = await chai
				.request(app)
				.delete('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);
		});

		it("should cause any requests for that product's information to fail", async () => {
			await chai
				.request(app)
				.delete('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken);

			const lookup = await chai
				.request(app)
				.get('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(lookup.status).to.equal(404);
			expect(lookup.body.error_code).to.equal('not_found');
		});

		it('should cause the item to be removed from item listing', async () => {
			await chai
				.request(app)
				.delete('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken);

			const listing = await chai
				.request(app)
				.get('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(listing.body.products.find((item) => item.barcode === '5053990123506')).to.be.an('undefined');
		});

		it('should prevent the item from being purchased', async () => {
			await chai
				.request(app)
				.delete('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken);

			const purchase = await chai
				.request(app)
				.post('/api/v1/products/5053990123506/purchase')
				.set('Authorization', 'Bearer ' + userToken)
				.send({
					count: 1,
				});

			expect(purchase.status).to.equal(404);
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.delete('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + userToken);

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Buy-in of a product', () => {
		it('should fail on nonexisting products', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/admin/products/88888888/buyIn')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					count: 1,
					buyPrice: 1,
					sellPrice: 1,
				});

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should fail on invalid request', async () => {
			const validRequest = {
				count: 1,
				buyPrice: 1,
				sellPrice: 1,
			};

			for (const missingField in validRequest) {
				const invalidRequest = { ...validRequest };
				delete invalidRequest[missingField];

				const res = await chai
					.request(app)
					.post('/api/v1/admin/products/5053990123506/buyIn')
					.set('Authorization', 'Bearer ' + adminToken)
					.send(invalidRequest);

				expect(res.status).to.equal(400, `request should fail when field ${missingField} is not defined`);
			}

			for (const negativeField in validRequest) {
				const invalidRequest = { ...validRequest };
				invalidRequest[negativeField] = -1;

				const res = await chai
					.request(app)
					.post('/api/v1/admin/products/5053990123506/buyIn')
					.set('Authorization', 'Bearer ' + adminToken)
					.send(invalidRequest);

				expect(res.status).to.equal(
					400,
					`request should fail when field ${negativeField} has a negative value`
				);
			}
		});

		it('should change the number of products in stock', async () => {
			const pre_query = await chai
				.request(app)
				.get('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(pre_query.status).to.equal(200);
			const initial_stock = pre_query.body.product.stock;

			const res = await chai
				.request(app)
				.post('/api/v1/admin/products/5053990123506/buyIn')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					count: 1,
					buyPrice: 1,
					sellPrice: 1,
				});

			expect(res.status).to.equal(200);
			expect(res.body.stock).to.equal(initial_stock + 1);

			const post_query = await chai
				.request(app)
				.get('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(post_query.status).to.equal(200);
			expect(post_query.body.product.stock).to.equal(initial_stock + 1);
		});

		it("should change the item's buyPrice and sellPrice", async () => {
			const pre_query = await chai
				.request(app)
				.get('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(pre_query.status).to.equal(200);
			const { buyPrice: initialBuyPrice, sellPrice: initialSellPrice } = pre_query.body.product;

			const res = await chai
				.request(app)
				.post('/api/v1/admin/products/5053990123506/buyIn')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					count: 1,
					buyPrice: initialBuyPrice + 1,
					sellPrice: initialSellPrice + 1,
				});

			expect(res.status).to.equal(200);
			expect(res.body.sellPrice).to.equal(initialSellPrice + 1);
			expect(res.body.buyPrice).to.equal(initialBuyPrice + 1);

			const post_query = await chai
				.request(app)
				.get('/api/v1/admin/products/5053990123506')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(post_query.status).to.equal(200);
			expect(post_query.body.product.sellPrice).to.equal(initialSellPrice + 1);
			expect(post_query.body.product.buyPrice).to.equal(initialBuyPrice + 1);
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/admin/products/5053990123506/buyIn')
				.set('Authorization', 'Bearer ' + userToken)
				.send({
					count: 1,
					buyPrice: 1,
					sellPrice: 1,
				});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe("Querying product's purchase history", () => {
		it('should return a list of purchases', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/products/5053990123506/purchaseHistory')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);
		});

		it('should error on nonexistent product', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/products/333344445555/purchaseHistory')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/products/5053990123506/purchaseHistory')
				.set('Authorization', 'Bearer ' + userToken);

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});
});
