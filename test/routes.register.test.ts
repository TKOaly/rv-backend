import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app.js';
import knex, { test_teardown } from '../src/db/knex.js';
import * as userStore from '../src/db/userStore.js';

import { after, afterEach, before, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

before(async () => {
	await knex.migrate.latest();
	await knex.seed.run();
});

after(async () => {
	await test_teardown();
});

describe('routes: register', () => {
	beforeEach(async () => {
		await knex.raw('SAVEPOINT test_begin;');
	});

	afterEach(async () => {
		await knex.raw('ROLLBACK TO SAVEPOINT test_begin;');
	});

	describe('Trying to register with missing field or bad password etc', () => {
		it('Request should not have missing keys', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/register')
				.set('RV-Terminal-Secret', process.env.RV_TERMINAL_SECRET)
				.send({
					// empty string
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('Username should not be empty', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/register')
				.set('RV-Terminal-Secret', process.env.RV_TERMINAL_SECRET)
				.send({
					username: '',
					password: 'test',
					fullName: 'm.erkki',
					email: 'erkki@testi.com',
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('User password should not be empty', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/register')
				.set('RV-Terminal-Secret', process.env.RV_TERMINAL_SECRET)
				.send({
					username: 'test',
					password: '',
					fullName: 'm.erkki',
					email: 'erkki@testi.com',
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should return 400 with missing terminal secret', async () => {
			const res = await chai.request(app).post('/api/v1/register').send({
				username: 'test',
				password: 'test',
				fullName: 'm.erkki',
				email: 'erkki@test.com',
			});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should return 403 with invalid terminal secret', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/register')
				.set('RV-Terminal-Secret', 'invalid secret')
				.send({
					username: 'test',
					password: 'test',
					fullName: 'm.erkki',
					email: 'erkki@test.com',
				});

			expect(res.status).to.equal(403);
			expect(res.body.error_code).to.equal('not_authorized');
		});
	});

	describe('Usernames and Emails should be uniques', () => {
		it('Username should be unique', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/register')
				.set('RV-Terminal-Secret', process.env.RV_TERMINAL_SECRET)
				.send({
					username: 'normal_user',
					password: 'test',
					fullName: 'm.erkki',
					email: 'erkki@testi.com',
				});

			expect(res.status).to.equal(409);
			expect(res.body.error_code).to.equal('identifier_taken');
		});

		it('Email should be unique', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/register')
				.set('RV-Terminal-Secret', process.env.RV_TERMINAL_SECRET)
				.send({
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
			const res = await chai
				.request(app)
				.post('/api/v1/register')
				.set('RV-Terminal-Secret', process.env.RV_TERMINAL_SECRET)
				.send({
					username: 'test',
					password: 'test',
					fullName: 'm.erkki',
					email: 'erkki@test.com',
				});

			expect(res.status).to.equal(201);
		});

		it('Registering should create a new user to the database', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/register')
				.set('RV-Terminal-Secret', process.env.RV_TERMINAL_SECRET)
				.send({
					username: 'abc',
					password: 'def',
					fullName: 'No Body',
					email: 'person@email.com',
				});

			expect(res.status).to.equal(201);

			const user = await userStore.findByUsername('abc');
			expect(user).to.exist;
		});

		it('It should return the new user', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/register')
				.set('RV-Terminal-Secret', process.env.RV_TERMINAL_SECRET)
				.send({
					username: 'abc',
					password: 'def',
					fullName: 'No Body',
					email: 'person@email.com',
				});

			expect(res.status).to.equal(201);

			const user = res.body.user;
			expect(user).to.exist;
			expect(user.email).to.equal('person@email.com');
		});

		it('New user should have role USER1', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/register')
				.set('RV-Terminal-Secret', process.env.RV_TERMINAL_SECRET)
				.send({
					username: 'abc',
					password: 'def',
					fullName: 'No Body',
					email: 'person@email.com',
				});

			expect(res.status).to.equal(201);

			const user = await userStore.findByUsername('abc');
			expect(user.role).to.equal('USER1');
		});

		it('New user should have no money', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/register')
				.set('RV-Terminal-Secret', process.env.RV_TERMINAL_SECRET)
				.send({
					username: 'abc',
					password: 'def',
					fullName: 'No Body',
					email: 'person@email.com',
				});

			expect(res.status).to.equal(201);

			const user = await userStore.findByUsername('abc');
			expect(user.moneyBalance).to.equal(0);
		});
	});
});
