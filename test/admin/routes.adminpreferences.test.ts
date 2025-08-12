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

describe('routes: admin preferences', () => {
	beforeEach(async () => {
		await knex.raw('SAVEPOINT test_begin;');
	});

	afterEach(async () => {
		await knex.raw('ROLLBACK TO SAVEPOINT test_begin;');
	});

	describe('listing preferences', () => {
		it('should return a list of preferences and values', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/preferences')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/preferences')
				.set('Authorization', 'Bearer ' + userToken);

			expect(res.status).to.equal(403);
			expect(res.body.error_code).to.equal('not_authorized');
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).get('/api/v1/admin/preferences');

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe("querying a preference by it's key", () => {
		it('should return its value', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/preferences/globalDefaultMargin')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);
			expect(res.body).to.contain.keys('preference');
			expect(res.body.preference).to.contain.all.keys('value', 'key');
			expect(res.body.preference.value).to.equal(0.23);
		});

		it('should fail for unknown keys', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/preferences/nonexistent')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should return a default value for an undefined preference', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/preferences/defaultProductCategory')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);
			expect(res.body).to.contain.keys('preference');
			expect(res.body.preference).to.contain.all.keys('value', 'key');
			expect(res.body.preference.value).to.equal(0);
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/preferences/globalDefaultMargin')
				.set('Authorization', 'Bearer ' + userToken);

			expect(res.status).to.equal(403);
			expect(res.body.error_code).to.equal('not_authorized');
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).get('/api/v1/admin/preferences/globalDefaultMargin');

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe("setting preference's value", () => {
		it('should fail for unknown keys', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/preferences/nonexistent')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					value: 0.25,
				});

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should cause queries to resolve with the new value', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/preferences/globalDefaultMargin')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					value: 0.25,
				});

			expect(res.status).to.equal(200);

			const post_res = await chai
				.request(app)
				.get('/api/v1/admin/preferences/globalDefaultMargin')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(post_res.status).to.equal(200);
			expect(post_res.body.preference.value).to.equal(0.25);
		});

		it('should return the new value', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/preferences/globalDefaultMargin')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					value: 0.25,
				});

			expect(res.status).to.equal(200);

			const updatedPreference = res.body.preference;
			expect(updatedPreference).to.exist;
			expect(updatedPreference.value).to.equal(0.25);
		});

		it('should fail when setting an invalid value', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/preferences/globalDefaultMargin')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					value: 'asd',
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/preferences/globalDefaultMargin')
				.set('Authorization', 'Bearer ' + userToken)
				.send({
					value: 0.25,
				});

			expect(res.status).to.equal(403);
			expect(res.body.error_code).to.equal('not_authorized');
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).patch('/api/v1/admin/preferences/globalDefaultMargin').send({
				value: 0.25,
			});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});
});
