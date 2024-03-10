const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

const server = require('../src/app');
const knex = require('../src/db/knex');
const jwt = require('../src/jwt/token');

chai.use(chaiHttp);

const token = jwt.sign({
	userId: 1,
});

describe(
	'routes: userPurchaseHistory',
	() => {
		beforeEach(async () => {
			await knex.migrate.rollback();
			await knex.migrate.latest();
			await knex.seed.run();
		});

		afterEach(async () => {
			await knex.migrate.rollback();
		});

		describe(
			'Fetching user purchase history',
			() => {
				it(
					'should return user purchase history',
					async () => {
						const res = await chai
							.request(server)
							.get('/api/v1/user/purchaseHistory')
							.set(
								'Authorization',
								'Bearer ' + token,
							);

						expect(res.status).to.equal(200);
					},
				);
			},
		);

		describe(
			'Fetching single purchase by id',
			() => {
				it(
					'should return the purchase event',
					async () => {
						const res = await chai
							.request(server)
							.get('/api/v1/user/purchaseHistory/2')
							.set(
								'Authorization',
								'Bearer ' + token,
							);

						expect(res.status).to.equal(200);
					},
				);

				it(
					'should return 404 on nonexistent purchase event',
					async () => {
						const res = await chai
							.request(server)
							.get('/api/v1/user/purchaseHistory/8319')
							.set(
								'Authorization',
								'Bearer ' + token,
							);

						expect(res.status).to.equal(404);
					},
				);
			},
		);
	},
);
