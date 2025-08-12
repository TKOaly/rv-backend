import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app.js';
import knex, { test_teardown } from '../src/db/knex.js';
import * as userStore from '../src/db/userStore.js';
import jwt from '../src/jwt/token.js';

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

describe('routes: authentication', () => {
	beforeEach(async () => {
		await knex.raw('SAVEPOINT test_begin;');
	});

	afterEach(async () => {
		await knex.raw('ROLLBACK TO SAVEPOINT test_begin;');
	});
	describe('Admin authentication', () => {
		it('logging in with admin role should work', async () => {
			/**
			 * 		it('with valid credentials, should respond with an authentication token', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate').send({
				username: 'normal_user',
				password: 'hunter2',
			});

			expect(res.status).to.equal(200);

			const token = jwt.verify(res.body.accessToken);
			expect(token.data.userId).to.exist;

			const user = await userStore.findByUsername('normal_user');
			expect(token.data.userId).to.equal(user.userId);
		});
			**/
			const res = await chai.request(app).post('/api/v1/authenticate').send({
				username: 'admin_user',
				password: 'admin123',
			});

			expect(res.status).to.equal(200);

			const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
			expect(decoded.data.userId).to.exist;

			const user = await userStore.findByUsername('admin_user');
			expect(decoded.data.userId).to.equal(user.userId);
		});

		it('should error on nonexistent user', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate').send({
				username: 'abc',
				password: 'defgh',
			});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_credentials');
		});

		it('should error the same way if only password is wrong', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate').send({
				username: 'normal_user',
				password: 'hunter69',
			});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_credentials');
		});

		it('should error on invalid parameters', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate').send({
				password: false,
			});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});
	});
	describe('User RFID authentication', () => {
		it('with valid credentials, should respond with an authentication token', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate/rfid').send({
				rfid: '1234',
				rvTerminalSecret: process.env.RV_TERMINAL_SECRET,
			});

			expect(res.status).to.equal(200);

			const token = jwt.verify(res.body.accessToken);
			expect(token.data.userId).to.exist;

			const user = await userStore.findByUsername('admin_user');
			expect(token.data.userId).to.equal(user.userId);
		});

		it('with invalid rfid, should return a 401 unauthorized response', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate/rfid').send({
				rfid: '123456',
				rvTerminalSecret: process.env.RV_TERMINAL_SECRET,
			});
			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_credentials');
		});

		it('invalid request should result in a 400 bad request response', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate/rfid').send({
				garbage: 'garbage',
				rvTerminalSecret: process.env.RV_TERMINAL_SECRET,
			});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('inactive user should not be able to login', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate/rfid').send({
				rfid: '999999',
				rvTerminalSecret: process.env.RV_TERMINAL_SECRET,
			});

			expect(res.status).to.equal(403);
			expect(res.body.error_code).to.equal('not_authorized');
		});

		it('should sign as rv terminal login if valid rvTerminalSecret ', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate/rfid').send({
				rfid: '1234',
				rvTerminalSecret: process.env.RV_TERMINAL_SECRET,
			});

			expect(res.status).to.equal(200);

			const token = jwt.verify(res.body.accessToken);
			expect(token.data.loggedInFromRvTerminal).to.exist;
			expect(token.data.loggedInFromRvTerminal).to.equal(true);
		});

		it('should not sign as rv terminal login if invalid rvTerminalSecret ', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/authenticate/rfid')
				.send({
					rfid: '1234',
					rvTerminalSecret: process.env.RV_TERMINAL_SECRET + 'lol',
				});

			expect(res.status).to.equal(401);
		});
	});

	describe('User authentication', () => {
		it('with valid credentials, should respond with an authentication token', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate').send({
				username: 'normal_user',
				password: 'hunter2',
			});

			expect(res.status).to.equal(200);

			const token = jwt.verify(res.body.accessToken);
			expect(token.data.userId).to.exist;

			const user = await userStore.findByUsername('normal_user');
			expect(token.data.userId).to.equal(user.userId);
		});

		it('with invalid password, should return a 401 unauthorized response', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate').send({
				username: 'normal_user',
				password: 'incorrect',
			});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_credentials');
		});

		it('with nonexistent user, should return a 401 unauthorized response', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate').send({
				username: 'nobody',
				password: 'something',
			});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_credentials');
		});

		it('invalid request should result in a 400 bad request response', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate').send({
				garbage: 'garbage',
			});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('inactive user should not be able to login', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate').send({
				username: 'user_inactive',
				password: 'inactive',
			});

			expect(res.status).to.equal(403);
			expect(res.body.error_code).to.equal('not_authorized');
		});

		it('should sign as rv terminal login if valid rvTerminalSecret ', async () => {
			const res = await chai.request(app).post('/api/v1/authenticate').send({
				username: 'normal_user',
				password: 'hunter2',
				rvTerminalSecret: process.env.RV_TERMINAL_SECRET,
			});

			expect(res.status).to.equal(200);

			const token = jwt.verify(res.body.accessToken);
			expect(token.data.loggedInFromRvTerminal).to.equal(true);
		});

		it('should not sign as rv terminal login if invalid rvTerminalSecret ', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/authenticate')
				.send({
					username: 'normal_user',
					password: 'hunter2',
					rvTerminalSecret: process.env.RV_TERMINAL_SECRET + 'lol',
				});

			expect(res.status).to.equal(200);

			const token = jwt.verify(res.body.accessToken);
			expect(token.data.loggedInFromRvTerminal).to.equal(false);
		});
	});
});
