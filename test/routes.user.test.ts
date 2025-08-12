import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app.js';
import * as historyStore from '../src/db/historyStore.js';
import knex, { test_teardown } from '../src/db/knex.js';
import * as userStore from '../src/db/userStore.js';
import jwt from '../src/jwt/token.js';

import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
import actions from '../src/db/actions.js';

const expect = chai.expect;

chai.use(chaiHttp);

const token = jwt.sign({
	userId: 1,
	loggedInFromRvTerminal: true,
});

const token2 = jwt.sign({
	userId: 2,
	loggedInFromRvTerminal: true,
});

const tokenNoRvTerminal = jwt.sign({
	userId: 1,
});

before(async () => {
	await knex.migrate.latest();
	await knex.seed.run();
});

after(async () => {
	await test_teardown();
});

describe('routes: user', () => {
	beforeEach(async () => {
		await knex.raw('SAVEPOINT test_begin;');
	});

	afterEach(async () => {
		await knex.raw('ROLLBACK TO SAVEPOINT test_begin;');
	});

	describe('Changing user rfid', () => {
		it('should succeed', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/changeRfid')
				.set('Authorization', 'Bearer ' + token)
				.send({
					rfid: '1337abcd',
				});
			expect(res.status).to.equal(204);
		});
		it('should not succeed if rfids collide false if user does not exist', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/changeRfid')
				.set('Authorization', 'Bearer ' + token)
				.send({
					rfid: '1337abcd',
				});
			expect(res.status).to.equal(204);
			const res2 = await chai
				.request(app)
				.post('/api/v1/user/changeRfid')
				.set('Authorization', 'Bearer ' + token2)
				.send({
					rfid: '1337abcd',
				});
			expect(res2.status).to.equal(409);
			const res3 = await chai
				.request(app)
				.post('/api/v1/user/changeRfid')
				.set('Authorization', 'Bearer ' + token)
				.send({
					rfid: '1337abcd',
				});
			expect(res3.status).to.equal(204);
		});
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
			expect(res.body.error_code).to.equal('bad_request');
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

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).get('/api/v1/user');

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
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
			expect(res.body.error_code).to.equal('identifier_taken');
		});

		it('should allow changing privacy level to valid value', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/changePrivacylevel')
				.set('Authorization', 'Bearer ' + token)
				.send({
					privacyLevel: 2,
				});

			expect(res.status).to.equal(204);
			const res2 = await chai
				.request(app)
				.get('/api/v1/user')
				.set('Authorization', 'Bearer ' + token);

			expect(res2.status).to.equal(200);
			expect(res2.body.user.privacyLevel).to.equal(2);
		});

		it('should deny changing privacy level to invalid value', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/changePrivacylevel')
				.set('Authorization', 'Bearer ' + token)
				.send({
					privacyLevel: 3,
				});

			expect(res.status).to.equal(400);
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
			expect(res.body.error_code).to.equal('identifier_taken');
		});

		it('should not allow modifying password', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/user')
				.set('Authorization', 'Bearer ' + token)
				.send({
					password: 'supersecret',
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should error if no fields are specified', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/user')
				.set('Authorization', 'Bearer ' + token)
				.send({});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).patch('/api/v1/user').send({
				username: 'abcd',
				fullName: 'abcd efgh',
				email: 'abc@def.ghi',
			});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Depositing money', () => {
		it('should increase account balance on cash deposit', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/deposit')
				.set('Authorization', 'Bearer ' + token)
				.send({
					amount: 150,
					type: 'cash',
				});

			expect(res.status).to.equal(200);

			expect(res.body.accountBalance).to.equal(650);

			const user = await userStore.findById(1);

			expect(user.moneyBalance).to.equal(650);
		});

		it('should increase account balance on banktransfer deposit', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/deposit')
				.set('Authorization', 'Bearer ' + token)
				.send({
					amount: 150,
					type: 'banktransfer',
				});

			expect(res.status).to.equal(200);

			expect(res.body.accountBalance).to.equal(650);

			const user = await userStore.findById(1);

			expect(user.moneyBalance).to.equal(650);
		});

		it('should error on depositing without type', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/deposit')
				.set('Authorization', 'Bearer ' + token)
				.send({
					amount: 150,
				});

			expect(res.status).to.equal(400);
		});

		it('should error on depositing with unknown type', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/deposit')
				.set('Authorization', 'Bearer ' + token)
				.send({
					amount: 150,
					type: 'bitcoin',
				});

			expect(res.status).to.equal(400);
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
					type: 'cash',
				});

			expect(res.status).to.equal(200);

			const newDepositHistory = await historyStore.getUserDepositHistory(user.userId);

			expect(newDepositHistory.length).to.equal(oldDepositHistory.length + 1);

			const depositEvent = newDepositHistory[0];

			expect(depositEvent.amount).to.equal(2371);
			expect(depositEvent.type).to.equal(actions.DEPOSITED_MONEY_CASH);
			expect(depositEvent.balanceAfter).to.equal(res.body.accountBalance);
		});

		it('should error on depositing a negative amount', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/deposit')
				.set('Authorization', 'Bearer ' + token)
				.send({
					amount: -200,
					type: 'cash',
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).post('/api/v1/user/deposit').send({
				amount: 150,
			});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});

		it('should fail if not logged in from rv terminal', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/deposit')
				.set('Authorization', 'Bearer ' + tokenNoRvTerminal)
				.send({
					amount: 150,
					type: 'cash',
				});

			expect(res.status).to.equal(403);
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

		it('should not return any passwords', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/changePassword')
				.set('Authorization', 'Bearer ' + token)
				.send({
					password: 'abcdefg',
				});

			expect(res.status).to.equal(204);
			expect(res.body).to.be.empty;
		});

		it('should error on invalid parameters', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/changePassword')
				.set('Authorization', 'Bearer ' + token)
				.send({
					username: 'mur',
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).post('/api/v1/user/changePassword').send({
				password: 'abcdefg',
			});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Changing rfid', () => {
		it('should change the rfid', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/changeRfid')
				.set('Authorization', 'Bearer ' + token)
				.send({
					rfid: '50ab45',
				});

			expect(res.status).to.equal(204);

			const user = await userStore.findById(1);

			expect(user.rfidHash).to.equal(userStore.oldRvRfidHash('50ab45'));
		});

		it('should not return any rfids', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/changeRfid')
				.set('Authorization', 'Bearer ' + token)
				.send({
					rfid: '50ab25',
				});

			expect(res.status).to.equal(204);
			expect(res.body).to.be.empty;
		});

		it('should error on invalid parameters', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/user/changeRfid')
				.set('Authorization', 'Bearer ' + token)
				.send({
					password: 'pass',
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called without authentication', async () => {
			const res = await chai.request(app).post('/api/v1/user/changeRfid').send({
				rfid: '50ab45',
			});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});
});
