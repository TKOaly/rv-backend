import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../../src/app.js';
import knex, { test_teardown } from '../../src/db/knex.js';
import jwt from '../../src/jwt/token.js';

import { after, afterEach, before, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

const token = jwt.sign({
	userId: 2,
	loggedInFromRvTerminal: true,
});

before(async () => {
	await knex.migrate.latest();
	await knex.seed.run();
});

after(async () => {
	await test_teardown();
});

describe('routes: admin utils', () => {
	beforeEach(async () => {
		await knex.raw('SAVEPOINT test_begin;');
	});

	afterEach(async () => {
		await knex.raw('ROLLBACK TO SAVEPOINT test_begin;');
	});

	describe('Endpoint getUserByUsername', () => {
		it('should return user if username exists', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/utils/getUserByUsername/normal_user')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
			expect(res.body.user).to.exist;
			expect(res.body.user.username).to.equal('normal_user');
		});
		it('should return 404 if username does not exist', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/utils/getUserByUsername/nonexistant_user')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
		});
	});
});
