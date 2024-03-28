import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app.js';
import knex, { test_teardown } from '../src/db/knex.js';
import jwt from '../src/jwt/token.js';

import { after, afterEach, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

const token = jwt.sign({
	userId: 1,
});

after(async () => {
	await test_teardown();
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
				.request(app)
				.get('/api/v1/user/purchaseHistory')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});
	});

	describe('Fetching single purchase by id', () => {
		it('should return the purchase event', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/user/purchaseHistory/2')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});

		it('should return 404 on nonexistent purchase event', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/user/purchaseHistory/8319')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
		});
	});
});
