import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../../src/app.js';
import knex from '../../src/db/knex.js';
import jwt from '../../src/jwt/token.js';

import { after, afterEach, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

const token = jwt.sign(
	{
		userId: 2,
	},
	process.env.JWT_ADMIN_SECRET
);
after(() => {
	knex.destroy();
});

describe('routes: admin history', () => {
	beforeEach(async () => {
		await knex.migrate.rollback();
		await knex.migrate.latest();
		await knex.seed.run();
	});

	afterEach(async () => {
		await knex.migrate.rollback();
	});

	describe('global purchase history', () => {
		describe('querying all purchases', () => {
			it('should return a list of purchases', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/purchaseHistory')
					.set('Authorization', 'Bearer ' + token);

				expect(res.status).to.equal(200);
			});
		});

		describe('Querying a purchase by id', () => {
			it('should return a purchase', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/purchaseHistory/1')
					.set('Authorization', 'Bearer ' + token);

				expect(res.status).to.equal(200);
			});

			it('should fail with a nonexsisting id', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/purchaseHistory/999999')
					.set('Authorization', 'Bearer ' + token);

				expect(res.status).to.equal(404);
				expect(res.body.error_code).to.equal('not_found');
			});
		});
	});

	describe('global deposit history', () => {
		describe('querying all events', () => {
			it('should return list of deposits', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/depositHistory')
					.set('Authorization', 'Bearer ' + token);

				expect(res.status).to.equal(200);
			});
		});

		describe('querying deposit by id', () => {
			it('should fail when using a nonexistent id', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/depositHistory/99999999')
					.set('Authorization', 'Bearer ' + token);

				expect(res.status).to.equal(404);
				expect(res.body.error_code).to.equal('not_found');
			});

			it('should return a deposit', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/depositHistory/1')
					.set('Authorization', 'Bearer ' + token);

				expect(res.status).to.equal(200);
			});
		});
	});
});
