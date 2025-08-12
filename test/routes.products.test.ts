import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app.js';
import * as historyStore from '../src/db/historyStore.js';
import knex, { test_teardown } from '../src/db/knex.js';
import * as productStore from '../src/db/productStore.js';
import * as userStore from '../src/db/userStore.js';
import jwt from '../src/jwt/token.js';

import { after, afterEach, before, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

const token = jwt.sign({
	userId: 1,
	loggedInFromRvTerminal: true,
});

const tokenNoRvTerminal = jwt.sign({
	userId: 1,
});

before(async () => {
	await knex.migrate.latest();
	await knex.seed.run();
});

after(async () => {
	await test_teardown();
});

describe('routes: products', () => {
	beforeEach(async () => {
		await knex.raw('SAVEPOINT test_begin;');
	});

	afterEach(async () => {
		await knex.raw('ROLLBACK TO SAVEPOINT test_begin;');
	});

	describe('Searching products', () => {
		it('should return barcode matching product if found', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/products/search')
				.set('Authorization', 'Bearer ' + token)
				.send({ query: '6415600026994' });
			expect(res.status).to.equal(200);
			expect(res.body.products.length).to.equal(1);
		});
		it('should return name matching product if found', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/products/search')
				.set('Authorization', 'Bearer ' + token)
				.send({ query: 'koff III' });

			expect(res.status).to.equal(200);
			expect(res.body.products.length).to.equal(1);
		});

		it('should return no matching product if not found', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/products/search')
				.set('Authorization', 'Bearer ' + token)
				.send({ query: 'motivaatio' });

			expect(res.status).to.equal(200);
			expect(res.body.products.length).to.equal(0);
		});

		it('should error on invalid parameters', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/products/search')
				.set('Authorization', 'Bearer ' + token)
				.send({ prii: 'prää' });

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).post('/api/v1/products/search').send({ query: 'koff III' });

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Fetching all products', () => {
		it('should return all products', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/products')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).get('/api/v1/products');

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Fetching product by barcode', () => {
		it('should return the product', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/products/5053990127443')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});

		it('should return 404 on nonexistent product', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/products/99999995')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).get('/api/v1/products/5053990127443');

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Purchasing product', () => {
		it('should deduct account balance and product stock', async () => {
			const oldUser = await userStore.findByUsername('normal_user');
			const oldProduct = await productStore.findByBarcode('8855702006834');

			const res = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 1,
				});

			expect(res.status).to.equal(200);

			const newUser = await userStore.findByUsername('normal_user');
			const newProduct = await productStore.findByBarcode('8855702006834');

			expect(newUser.moneyBalance).to.equal(oldUser.moneyBalance - oldProduct.sellPrice);
			expect(newUser.moneyBalance).to.equal(res.body.accountBalance);

			expect(newProduct.stock).to.equal(oldProduct.stock - 1);
			expect(newProduct.stock).to.equal(res.body.productStock);
		});

		it('should create an event into purchase history', async () => {
			const user = await userStore.findByUsername('normal_user');
			const oldPurchaseHistory = await historyStore.getUserPurchaseHistory(user.userId);

			const res = await chai
				.request(app)
				.post('/api/v1/products/6417901011105/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 1,
				});

			expect(res.status).to.equal(200);

			const newPurchaseHistory = await historyStore.getUserPurchaseHistory(user.userId);

			expect(newPurchaseHistory.length).to.equal(oldPurchaseHistory.length + 1);
			expect(res.body.purchases.length).to.equal(1);

			const purchaseEvent = newPurchaseHistory[0];

			expect(purchaseEvent.product.barcode).to.equal('6417901011105');
			expect(purchaseEvent.balanceAfter).to.equal(res.body.accountBalance);
			expect(purchaseEvent.stockAfter).to.equal(res.body.productStock);
		});

		it('should create multiple history events on multibuy', async () => {
			const user = await userStore.findByUsername('normal_user');
			const oldPurchaseHistory = await historyStore.getUserPurchaseHistory(user.userId);

			const res = await chai
				.request(app)
				.post('/api/v1/products/6417901011105/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 3,
				});

			expect(res.status).to.equal(200);

			const newPurchaseHistory = await historyStore.getUserPurchaseHistory(user.userId);

			expect(newPurchaseHistory.length).to.equal(oldPurchaseHistory.length + 3);
			expect(res.body.purchases.length).to.equal(3);
		});

		it('should allow buying product even with negative stock', async () => {
			const oldProduct = await productStore.findByBarcode('6415600025300');
			expect(oldProduct.stock).to.be.lessThan(0);

			const res = await chai
				.request(app)
				.post('/api/v1/products/6415600025300/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 1,
				});

			expect(res.status).to.equal(200);

			const newProduct = await productStore.findByBarcode('6415600025300');
			expect(newProduct.stock).to.equal(oldProduct.stock - 1);
		});

		it('should return 404 on nonexistent product', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/products/1234567890123/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 1,
				});

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should error on insufficient funds', async () => {
			const user = await userStore.findByUsername('normal_user');
			await userStore.updateUser(user.userId, { moneyBalance: 0 });

			const res = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 1,
				});

			expect(res.status).to.equal(403);
			expect(res.body.error_code).to.equal('insufficient_funds');
		});
		it('should fail if not logged in from rv terminal', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/purchase')
				.set('Authorization', 'Bearer ' + tokenNoRvTerminal)
				.send({
					count: 1,
				});

			expect(res.status).to.equal(403);
		});
	});
	describe('Returning a product', () => {
		it('should increase account balance and product stock', async () => {
			const oldUser = await userStore.findByUsername('normal_user');
			const oldProduct = await productStore.findByBarcode('8855702006834');

			const res1 = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 1,
				});

			expect(res1.status).to.equal(200);
			const res2 = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/return')
				.set('Authorization', 'Bearer ' + token);
			expect(res2.status).to.equal(200);

			const newUser = await userStore.findByUsername('normal_user');
			const newProduct = await productStore.findByBarcode('8855702006834');

			expect(newUser.moneyBalance).to.equal(oldUser.moneyBalance);

			expect(newProduct.stock).to.equal(oldProduct.stock);
		});

		it('twice should increase account balance and product stock twice', async () => {
			const oldUser = await userStore.findByUsername('normal_user');
			const oldProduct = await productStore.findByBarcode('8855702006834');

			const res1 = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 2,
				});

			expect(res1.status).to.equal(200);
			const res2 = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/return')
				.set('Authorization', 'Bearer ' + token);
			expect(res2.status).to.equal(200);

			const res3 = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/return')
				.set('Authorization', 'Bearer ' + token);
			expect(res3.status).to.equal(200);

			const newUser = await userStore.findByUsername('normal_user');
			const newProduct = await productStore.findByBarcode('8855702006834');

			expect(newUser.moneyBalance).to.equal(oldUser.moneyBalance);

			expect(newProduct.stock).to.equal(oldProduct.stock);
		});

		it('should error 403 on nonexistent product', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/products/1234567890123/return')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(403);
		});

		it('should error if no recent purchases', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/return')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(403);
		});

		it('should not increase funds or stock if recent purchases were already returned', async () => {
			const res1 = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 1,
				});

			expect(res1.status).to.equal(200);
			const res2 = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/return')
				.set('Authorization', 'Bearer ' + token);
			expect(res2.status).to.equal(200);

			const oldUser = await userStore.findByUsername('normal_user');
			const oldProduct = await productStore.findByBarcode('8855702006834');

			const res3 = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/return')
				.set('Authorization', 'Bearer ' + token);

			expect(res3.status).to.equal(403);

			const newUser = await userStore.findByUsername('normal_user');
			const newProduct = await productStore.findByBarcode('8855702006834');

			expect(newUser.moneyBalance).to.equal(oldUser.moneyBalance);

			expect(newProduct.stock).to.equal(oldProduct.stock);
		});
		it('should fail if not logged in from rv terminal', async () => {
			const res1 = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 1,
				});

			expect(res1.status).to.equal(200);
			const res2 = await chai
				.request(app)
				.post('/api/v1/products/8855702006834/return')
				.set('Authorization', 'Bearer ' + tokenNoRvTerminal);
			expect(res2.status).to.equal(403);
		});

		it('should error on invalid parameters', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/products/6417901011105/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 1.8,
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).post('/api/v1/products/8855702006834/purchase').send({
				count: 1,
			});
			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});
});
