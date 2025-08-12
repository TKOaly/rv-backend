import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../../src/app.js';
import knex, { test_teardown } from '../../src/db/knex.js';
import jwt from '../../src/jwt/token.js';

import { after, afterEach, before, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

const adminToken = jwt.sign({
	userId: 2,
});
const userToken = jwt.sign({
	userId: 1,
});

before(async () => {
	await knex.migrate.latest();
	await knex.seed.run();
});

after(async () => {
	await test_teardown();
});

describe('routes: admin history', () => {
	beforeEach(async () => {
		await knex.raw('SAVEPOINT test_begin;');
	});

	afterEach(async () => {
		await knex.raw('ROLLBACK TO SAVEPOINT test_begin;');
	});

	describe('global purchase history', () => {
		describe('querying all purchases', () => {
			it('should return a list of purchases', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/purchaseHistory')
					.set('Authorization', 'Bearer ' + adminToken);

				expect(res.status).to.equal(200);
			});

			it('should not be called by unprivileged user', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/purchaseHistory')
					.set('Authorization', 'Bearer ' + userToken);

				expect(res.status).to.equal(403);
				expect(res.body.error_code).to.equal('not_authorized');
			});

			it('should not be called without authentication', async () => {
				const res = await chai.request(app).get('/api/v1/admin/purchaseHistory');

				expect(res.status).to.equal(401);
				expect(res.body.error_code).to.equal('invalid_token');
			});
		});

		describe('querying purchases', () => {
			it('with limit should limit amount of results', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/purchaseHistory')
					.set('Authorization', 'Bearer ' + adminToken)
					.query({
						limit: 2,
					});

				expect(res.status).to.equal(200);
				expect(res.body.purchases.length).to.equal(2);
			});
			it('with offset should return purchases starting from the offset', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/purchaseHistory')
					.set('Authorization', 'Bearer ' + adminToken)
					.query({
						limit: 2,
						offset: 7,
					});

				expect(res.status).to.equal(200);
				expect(res.body.purchases.length).to.equal(2);
				expect(res.body.purchases[0].purchaseId).to.equal(6);
				expect(res.body.purchases[1].purchaseId).to.equal(5);
			});
		});

		describe('Querying a purchase by id', () => {
			it('should return a purchase', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/purchaseHistory/1')
					.set('Authorization', 'Bearer ' + adminToken);

				expect(res.status).to.equal(200);
			});

			it('should fail with a nonexisting id', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/purchaseHistory/999999')
					.set('Authorization', 'Bearer ' + adminToken);

				expect(res.status).to.equal(404);
				expect(res.body.error_code).to.equal('not_found');
			});

			it('should not be called by unprivileged user', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/purchaseHistory/1')
					.set('Authorization', 'Bearer ' + userToken);

				expect(res.status).to.equal(403);
				expect(res.body.error_code).to.equal('not_authorized');
			});

			it('should not be called without authentication', async () => {
				const res = await chai.request(app).get('/api/v1/admin/purchaseHistory/1');

				expect(res.status).to.equal(401);
				expect(res.body.error_code).to.equal('invalid_token');
			});
		});
	});

	describe('global deposit history', () => {
		describe('querying all events', () => {
			it('should return list of deposits', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/depositHistory')
					.set('Authorization', 'Bearer ' + adminToken);

				expect(res.status).to.equal(200);
			});

			it('should not be called by unprivileged user', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/depositHistory')
					.set('Authorization', 'Bearer ' + userToken);

				expect(res.status).to.equal(403);
				expect(res.body.error_code).to.equal('not_authorized');
			});

			it('should not be called without authentication', async () => {
				const res = await chai.request(app).get('/api/v1/admin/depositHistory');

				expect(res.status).to.equal(401);
				expect(res.body.error_code).to.equal('invalid_token');
			});
		});

		describe('querying deposit history', () => {
			it('with limit should limit amount of results', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/depositHistory')
					.set('Authorization', 'Bearer ' + adminToken)
					.send({ limit: 2 });

				expect(res.status).to.equal(200);
				expect(res.body.deposits.length).to.equal(2);
			});
			it('with offset should return deposits starting from the offset', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/depositHistory')
					.set('Authorization', 'Bearer ' + adminToken)
					.send({ offset: 3, limit: 2 });

				expect(res.status).to.equal(200);
				expect(res.body.deposits.length).to.equal(2);
				expect(res.body.deposits[0].depositId).to.equal(2);
				expect(res.body.deposits[1].depositId).to.equal(1);
			});
		});

		describe('querying deposit by id', () => {
			it('should fail when using a nonexistent id', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/depositHistory/99999999')
					.set('Authorization', 'Bearer ' + adminToken);

				expect(res.status).to.equal(404);
				expect(res.body.error_code).to.equal('not_found');
			});

			it('should return a deposit', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/depositHistory/1')
					.set('Authorization', 'Bearer ' + adminToken);

				expect(res.status).to.equal(200);
			});

			it('should not be called by unprivileged user', async () => {
				const res = await chai
					.request(app)
					.get('/api/v1/admin/depositHistory/1')
					.set('Authorization', 'Bearer ' + userToken);

				expect(res.status).to.equal(403);
				expect(res.body.error_code).to.equal('not_authorized');
			});

			it('should not be called without authentication', async () => {
				const res = await chai.request(app).get('/api/v1/admin/depositHistory/1');

				expect(res.status).to.equal(401);
				expect(res.body.error_code).to.equal('invalid_token');
			});
		});
	});
});
