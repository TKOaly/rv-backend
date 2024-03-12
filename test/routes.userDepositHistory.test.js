import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app.js';
import knex from '../src/db/knex.js';
import jwt from '../src/jwt/token.js';

const expect = chai.expect;

chai.use(chaiHttp);

const token = jwt.sign({
	userId: 1,
});

describe('routes: userDepositHistory', () => {
	beforeEach(async () => {
		await knex.migrate.rollback();
		await knex.migrate.latest();
		await knex.seed.run();
	});

	afterEach(async () => {
		await knex.migrate.rollback();
	});

	describe('Fetching user deposit history', () => {
		it('should return user deposit history', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/user/depositHistory')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
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
		});
	});
});
