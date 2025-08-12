import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app.js';
import knex, { test_teardown } from '../src/db/knex.js';
import jwt from '../src/jwt/token.js';

import { after, afterEach, before, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

const token = jwt.sign({
	userId: 1,
});

before(async () => {
	await knex.migrate.latest();
	await knex.seed.run();
});

after(async () => {
	await test_teardown();
});

describe('routes: userDepositHistory', () => {
	beforeEach(async () => {
		await knex.raw('SAVEPOINT test_begin;');
	});

	afterEach(async () => {
		await knex.raw('ROLLBACK TO SAVEPOINT test_begin;');
	});

	describe('Fetching user deposit history', () => {
		it('should return user deposit history', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/user/depositHistory')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).get('/api/v1/user/depositHistory');

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Fetching single deposit by id', () => {
		it('should return the deposit event', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/user/depositHistory/3')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});

		it('should return 404 on nonexistent deposit event', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/user/depositHistory/6677614')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).get('/api/v1/user/depositHistory/3');

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});
});
