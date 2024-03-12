import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../../src/app.js';
import knex from '../../src/db/knex.js';
import userStore from '../../src/db/userStore.js';
import jwt from '../../src/jwt/token.js';

const expect = chai.expect;

chai.use(chaiHttp);

describe('routes: admin authentication', () => {
	beforeEach(async () => {
		await knex.migrate.rollback();
		await knex.migrate.latest();
		await knex.seed.run();
	});

	afterEach(async () => {
		await knex.migrate.rollback();
	});

	describe('Admin authentication', () => {
		it('logging in with admin role should work', async () => {
			const res = await chai.request(app).post('/api/v1/admin/authenticate').send({
				username: 'admin_user',
				password: 'admin123',
			});

			expect(res.status).to.equal(200);

			const decoded = jwt.verify(res.body.accessToken, process.env.JWT_ADMIN_SECRET);
			expect(decoded.data.userId).to.exist;

			const user = await userStore.findByUsername('admin_user');
			expect(decoded.data.userId).to.equal(user.userId);
		});

		it('admin tokens should not be signed with the same key as user tokens', async () => {
			const res = await chai.request(app).post('/api/v1/admin/authenticate').send({
				username: 'admin_user',
				password: 'admin123',
			});

			const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
			expect(decoded).to.equal(null);
		});

		it('only admins should be able to authenticate', async () => {
			const res = await chai.request(app).post('/api/v1/admin/authenticate').send({
				username: 'normal_user',
				password: 'hunter2',
			});

			expect(res.status).to.equal(403);
		});
	});
});
