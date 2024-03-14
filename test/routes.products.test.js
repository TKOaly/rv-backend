import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app.js';
import historyStore from '../src/db/historyStore.js';
import knex from '../src/db/knex.js';
import productStore from '../src/db/productStore.js';
import userStore from '../src/db/userStore.js';
import jwt from '../src/jwt/token.js';

import { after, afterEach, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

const token = jwt.sign({
	userId: 1,
});

after(() => {
	knex.destroy();
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

	describe('Searching products', () => {
		it('should return matching product if found', async () => {
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
	});

	describe('Fetching all products', () => {
		it('should return all products', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/products')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
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

		it('should return 404 on nonexistent product', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/products/1234567890123/purchase')
				.set('Authorization', 'Bearer ' + token)
				.send({
					count: 1,
				});

			expect(res.status).to.equal(404);
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

			expect(res.body.error_code).to.equal('insufficient_funds');
		});
	});
});
