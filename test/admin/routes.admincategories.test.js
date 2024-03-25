import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../../src/app.js';
import categoryStore from '../../src/db/categoryStore.js';
import knex, { test_teardown } from '../../src/db/knex.js';
import jwt from '../../src/jwt/token.js';

import { after, afterEach, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

chai.use(chaiHttp);

const adminToken = jwt.sign(
	{
		userId: 2,
	},
	process.env.JWT_ADMIN_SECRET
);
const userToken = jwt.sign({
	userId: 1,
});

after(async () => {
	await test_teardown();
});

describe('routes: admin categories', () => {
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
			const res = await chai
				.request(app)
				.get('/api/v1/admin/categories')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/categories')
				.set('Authorization', 'Bearer ' + userToken);

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Fetching category by id', () => {
		it('should return the category', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/categories/11')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);
		});

		it('should error on nonexistent category', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/categories/666')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(404);
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.get('/api/v1/admin/categories/11')
				.set('Authorization', 'Bearer ' + userToken);

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Creating new category', () => {
		it('should create new category', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/admin/categories')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					description: 'Food waste',
				});

			expect(res.status).to.equal(201);

			const newId = res.body.category.categoryId;

			const newCategory = await categoryStore.findById(newId);
			expect(newCategory).to.exist;
			expect(newCategory.description).to.equal('Food waste');
		});

		it('should return the new category', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/admin/categories')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					description: 'Food waste',
				});

			expect(res.status).to.equal(201);
		});

		it('should error on invalid parameters', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/admin/categories')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					abcd: 1,
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.post('/api/v1/admin/categories')
				.set('Authorization', 'Bearer ' + userToken)
				.send({
					description: 'Food waste',
				});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('Modifying category data', () => {
		it('should modify the category', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/categories/20')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					description: 'Radioactive waste',
				});

			expect(res.status).to.equal(200);

			const newCategory = await categoryStore.findById(20);
			expect(newCategory).to.exist;
			expect(newCategory.description).to.equal('Radioactive waste');
		});

		it('should return the updated category', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/categories/20')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					description: 'Radioactive waste',
				});

			expect(res.status).to.equal(200);
			expect(res.body.category.description).to.equal('Radioactive waste');
		});

		it('should error on nonexistent category', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/categories/88888888')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					description: 'Radioactive waste',
				});

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should error on invalid parameters', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/categories/20')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					description: 5,
				});

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.patch('/api/v1/admin/categories/20')
				.set('Authorization', 'Bearer ' + userToken)
				.send({
					description: 'Radioactive waste',
				});

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});

	describe('deleting a category', () => {
		it('should delete the category', async () => {
			const res = await chai
				.request(app)
				.delete('/api/v1/admin/categories/20')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);

			const deletedCategory = await categoryStore.findById(20);
			expect(deletedCategory).to.not.exist;

			const post_res = await chai
				.request(app)
				.get('/api/v1/admin/categories/20')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(post_res.status).to.equal(404);
			expect(post_res.body.error_code).to.equal('not_found');
		});

		it('should return the deleted category and moved items', async () => {
			const res = await chai
				.request(app)
				.delete('/api/v1/admin/categories/20')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);
		});

		it('should move items to the default category', async () => {
			const pre_res = await chai
				.request(app)
				.get('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(pre_res.status).to.equal(200);

			const initial_items = pre_res.body.products
				.filter((prod) => prod.category.categoryId === 20)
				.map((prod) => prod.barcode);

			const res = await chai
				.request(app)
				.delete('/api/v1/admin/categories/20')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);
			expect(res.body.movedProducts.sort()).to.deep.equal(initial_items.sort());

			const post_res = await chai
				.request(app)
				.get('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(post_res.status).to.equal(200);

			post_res.body.products
				.filter((prod) => initial_items.indexOf(prod.barcode) !== -1)
				.forEach((prod) => expect(prod.category.categoryId).to.not.equal(20));
		});

		it('should prevent adding new products to the category', async () => {
			const res = await chai
				.request(app)
				.delete('/api/v1/admin/categories/20')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(200);

			const post_res = await chai
				.request(app)
				.post('/api/v1/admin/products')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({
					barcode: '575757575757',
					name: 'Epäonnistuvaa ruokaa',
					categoryId: 20,
					buyPrice: 367,
					sellPrice: 370,
					stock: 1,
				});

			expect(post_res.status).to.equal(400);
			expect(post_res.body.error_code).to.equal('invalid_reference');
		});

		it('should fail with a nonexisting category', async () => {
			const res = await chai
				.request(app)
				.delete('/api/v1/admin/categories/9999')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should fail with the default category', async () => {
			const res = await chai
				.request(app)
				.delete('/api/v1/admin/categories/0')
				.set('Authorization', 'Bearer ' + adminToken);

			expect(res.status).to.equal(403);
			expect(res.body.error_code).to.equal('bad_request');
		});

		it('should not be called by unprivileged user', async () => {
			const res = await chai
				.request(app)
				.delete('/api/v1/admin/categories/20')
				.set('Authorization', 'Bearer ' + userToken);

			expect(res.status).to.equal(401);
			expect(res.body.error_code).to.equal('invalid_token');
		});
	});
});
