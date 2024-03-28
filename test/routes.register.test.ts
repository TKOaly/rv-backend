import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app.js';
import knex, { test_teardown } from '../src/db/knex.js';
import userStore from '../src/db/userStore.js';

import { after, afterEach, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

after(async () => {
	await test_teardown();
});

describe('routes: register', () => {
	beforeEach(async () => {
		await knex.migrate.rollback();
		await knex.migrate.latest();
		await knex.seed.run();
	});

	afterEach(async () => {
		await knex.migrate.rollback();
	});

	describe('Trying to register with missing field or bad password etc', () => {
		it('Request should not have missing keys', async () => {
			const res = await chai.request(app).post('/api/v1/register').send({
				// empty string
			});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('Username should not be empty', async () => {
			const res = await chai.request(app).post('/api/v1/register').send({
				username: '',
				password: 'test',
				fullName: 'm.erkki',
				email: 'erkki@testi.com',
			});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('User password should not be empty', async () => {
			const res = await chai.request(app).post('/api/v1/register').send({
				username: 'test',
				password: '',
				fullName: 'm.erkki',
				email: 'erkki@testi.com',
			});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});
	});

	describe('Usernames and Emails should be uniques', () => {
		it('Username should be unique', async () => {
			const res = await chai.request(app).post('/api/v1/register').send({
				username: 'normal_user',
				password: 'test',
				fullName: 'm.erkki',
				email: 'erkki@testi.com',
			});

			expect(res.status).to.equal(409);
			expect(res.body.error_code).to.equal('identifier_taken');
		});

		it('Email should be unique', async () => {
			const res = await chai.request(app).post('/api/v1/register').send({
				username: 'test',
				password: 'test',
				fullName: 'm.erkki',
				email: 'user@example.com',
			});

			expect(res.status).to.equal(409);
			expect(res.body.error_code).to.equal('identifier_taken');
		});
	});

	describe('User should be able to register to service', () => {
		it('With all required fields user should be registered to service', async () => {
			const res = await chai.request(app).post('/api/v1/register').send({
				username: 'test',
				password: 'test',
				fullName: 'm.erkki',
				email: 'erkki@test.com',
			});

			expect(res.status).to.equal(201);
		});

		it('Registering should create a new user to the database', async () => {
			const res = await chai.request(app).post('/api/v1/register').send({
				username: 'abc',
				password: 'def',
				fullName: 'No Body',
				email: 'person@email.com',
			});

			expect(res.status).to.equal(201);

			const user = await userStore.findByUsername('abc');
			expect(user).to.exist;
		});
	});
});
