import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app.js';
import historyStore from '../src/db/historyStore.js';
import knex from '../src/db/knex.js';
import userStore from '../src/db/userStore.js';
import jwt from '../src/jwt/token.js';

import { after, afterEach, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

const token = jwt.sign({
	userId: 1,
});

after(() => {
	knex.destroy();
});

describe('routes: user', () => {
	beforeEach(async () => {
		await knex.migrate.rollback();
		await knex.migrate.latest();
		await knex.seed.run();
	});

	afterEach(async () => {
		await knex.migrate.rollback();
	});

	describe('Checking user existence', () => {
		it('should return true if user exists', async () => {
			const res = await chai.request(app).post('/api/v1/user/user_exists').send({
				username: 'admin_user',
			});
			expect(res.status).to.equal(200);
			expect(res.body.exists).to.equal(true);
		});
		it('should return false if user does not exist', async () => {
			const res = await chai.request(app).post('/api/v1/user/user_exists').send({
				username: 'admin_user2',
			});
			expect(res.status).to.equal(200);
			expect(res.body.exists).to.equal(false);
		});
		it('invalid request should result in a 400 bad request response', async () => {
			const res = await chai.request(app).post('/api/v1/user/user_exists').send({
				garbage: 'garbage',
			});
			expect(res.status).to.equal(400);
		});
	});

	describe('Fetching user info', () => {
		it('should return user info', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/user')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});
	});

	describe('Modifying user info', () => {
		it('should modify user', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/user')
				.set('Authorization', 'Bearer ' + token)
				.send({
					username: 'abcd',
					fullName: 'abcd efgh',
					email: 'abc@def.ghi',
				});

			expect(res.status).to.equal(200);

			expect(res.body.user.username).to.equal('abcd');
			expect(res.body.user.fullName).to.equal('abcd efgh');
			expect(res.body.user.email).to.equal('abc@def.ghi');

			const user = await userStore.findById(1);

			expect(user.username).to.equal('abcd');
			expect(user.fullName).to.equal('abcd efgh');
			expect(user.email).to.equal('abc@def.ghi');
		});

		it('should allow modifying only some fields', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/user')
				.set('Authorization', 'Bearer ' + token)
				.send({
					email: 'abc@def.ghi',
				});

			expect(res.status).to.equal(200);

			expect(res.body.user.username).to.equal('normal_user');
			expect(res.body.user.fullName).to.equal('John Doe');
			expect(res.body.user.email).to.equal('abc@def.ghi');
		});

		it('should deny changing username to one already taken', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/user')
				.set('Authorization', 'Bearer ' + token)
				.send({
					username: 'admin_user',
				});

			expect(res.status).to.equal(409);
		});

		it('should deny changing email to one already taken', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/user')
				.set('Authorization', 'Bearer ' + token)
				.send({
					email: 'admin@example.com',
				});

			expect(res.status).to.equal(409);
		});

		it('should error if no fields are specified', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/user')
				.set('Authorization', 'Bearer ' + token)
				.send({});

			expect(res.status).to.equal(400);
		});
	});

	describe('Depositing money', () => {
		it('should increase account balance', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/deposit')
				.set('Authorization', 'Bearer ' + token)
				.send({
					amount: 150,
				});

			expect(res.status).to.equal(200);

			expect(res.body.accountBalance).to.equal(650);

			const user = await userStore.findById(1);

			expect(user.moneyBalance).to.equal(650);
		});

		it('should create an event into deposit history', async () => {
			const user = await userStore.findByUsername('normal_user');
			const oldDepositHistory = await historyStore.getUserDepositHistory(user.userId);

			const res = await chai
				.request(app)
				.post('/api/v1/user/deposit')
				.set('Authorization', 'Bearer ' + token)
				.send({
					amount: 2371,
				});

			expect(res.status).to.equal(200);

			const newDepositHistory = await historyStore.getUserDepositHistory(user.userId);

			expect(newDepositHistory.length).to.equal(oldDepositHistory.length + 1);

			const depositEvent = newDepositHistory[0];

			expect(depositEvent.amount).to.equal(2371);
			expect(depositEvent.balanceAfter).to.equal(res.body.accountBalance);
		});

		it('should error on depositing a negative amount', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/deposit')
				.set('Authorization', 'Bearer ' + token)
				.send({
					amount: -200,
				});

			expect(res.status).to.equal(400);
		});
	});

	describe('Changing password', () => {
		it('should change the password', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/changePassword')
				.set('Authorization', 'Bearer ' + token)
				.send({
					password: 'abcdefg',
				});

			expect(res.status).to.equal(204);

			const user = await userStore.findById(1);
			const passwordMatches = await userStore.verifyPassword('abcdefg', user.passwordHash);

			expect(passwordMatches).to.be.true;
		});
	});
});
