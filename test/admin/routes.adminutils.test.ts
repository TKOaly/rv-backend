import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../../src/app.js';
import knex, { test_teardown } from '../../src/db/knex.js';
import jwt from '../../src/jwt/token.js';

import { after, afterEach, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

const token = jwt.sign({
	userId: 2,
	loggedInFromRvTerminal: true,
});

after(async () => {
	await test_teardown();
});

describe('routes: admin utils', () => {
	beforeEach(async () => {
		await knex.migrate.rollback();
		await knex.migrate.latest();
		await knex.seed.run();
	});

	afterEach(async () => {
		await knex.migrate.rollback();
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

	describe('Endpoint getUserByEmail', () => {
		it('should return user if email exists', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/utils/getUserByEmail/user@example.com')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
			expect(res.body.user).to.exist;
			expect(res.body.user.email).to.equal('user@example.com');
		});
		it('should return 404 if username does not exist', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/utils/getUserByEmail/nonexistant_user@example.com')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
		});
	});

	describe('Endpoint getUserByFullName', () => {
		it('should return user if real name exists', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/utils/getUserByFullName/John Doe')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
			expect(res.body.user).to.exist;
			expect(res.body.user.name).to.equal('John Doe');
		});
		it('should return 404 if username does not exist', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/utils/getUserByFullName/nonexistant_user')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
		});
	});
});
