const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

const server = require('../src/app');
const knex = require('../src/db/knex');
const jwt = require('../src/jwt/token');

chai.use(chaiHttp);

const token = jwt.sign({ userId: 1 });

describe('routes: categories', () => {
	beforeEach(async () => {
		await knex.migrate.rollback();
		await knex.migrate.latest();
		await knex.seed.run();
	});

	afterEach(async () => {
		await knex.migrate.rollback();
	});

	describe('Fetching all categories', () => {
		it('should return all categories', async () => {
			const res = await chai.request(server).get('/api/v1/categories')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});
	});

	describe('Fetching category by id', () => {
		it('should return the category', async () => {
			const res = await chai.request(server).get('/api/v1/categories/21')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});

		it('should return 404 on nonexistent category', async () => {
			const res = await chai.request(server).get('/api/v1/categories/548')
				.set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
		});
	});
});
