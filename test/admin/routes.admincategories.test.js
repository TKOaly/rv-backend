const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

const server = require('../../src/app');
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');
const categoryStore = require('../../src/db/categoryStore');

chai.use(chaiHttp);

const token = jwt.sign({ userId: 2 }, process.env.JWT_ADMIN_SECRET);

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
			const res = await chai.request(server).get(
				'/api/v1/admin/categories',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});
	});

	describe('Fetching category by id', () => {
		it('should return the category', async () => {
			const res = await chai.request(server).get(
				'/api/v1/admin/categories/11',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});

		it('should error on nonexistent category', async () => {
			const res = await chai.request(server).get(
				'/api/v1/admin/categories/666',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
		});
	});

	describe('Creating new category', () => {
		it('should create new category', async () => {
			const res = await chai.request(server).post(
				'/api/v1/admin/categories',
			).set('Authorization', 'Bearer ' + token).send({
				description: 'Food waste',
			});

			expect(res.status).to.equal(201);

			const newId = res.body.category.categoryId;

			const newCategory = await categoryStore.findById(newId);
			expect(newCategory).to.exist;
			expect(newCategory.description).to.equal('Food waste');
		});

		it('should return the new category', async () => {
			const res = await chai.request(server).post(
				'/api/v1/admin/categories',
			).set('Authorization', 'Bearer ' + token).send({
				description: 'Food waste',
			});

			expect(res.status).to.equal(201);
		});

		it('should error on invalid parameters', async () => {
			const res = await chai.request(server).post(
				'/api/v1/admin/categories',
			).set('Authorization', 'Bearer ' + token).send({ abcd: 1 });

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});
	});

	describe('Modifying category data', () => {
		it('should modify the category', async () => {
			const res = await chai.request(server).patch(
				'/api/v1/admin/categories/20',
			).set('Authorization', 'Bearer ' + token).send({
				description: 'Radioactive waste',
			});

			expect(res.status).to.equal(200);

			const newCategory = await categoryStore.findById(20);
			expect(newCategory).to.exist;
			expect(newCategory.description).to.equal('Radioactive waste');
		});

		it('should return the updated category', async () => {
			const res = await chai.request(server).patch(
				'/api/v1/admin/categories/20',
			).set('Authorization', 'Bearer ' + token).send({
				description: 'Radioactive waste',
			});

			expect(res.status).to.equal(200);
			expect(res.body.category.description).to.equal('Radioactive waste');
		});

		it('should error on nonexistent category', async () => {
			const res = await chai.request(server).patch(
				'/api/v1/admin/categories/88888888',
			).set('Authorization', 'Bearer ' + token).send({
				description: 'Radioactive waste',
			});

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should error on invalid parameters', async () => {
			const res = await chai.request(server).patch(
				'/api/v1/admin/categories/20',
			).set('Authorization', 'Bearer ' + token).send({ description: 5 });

			expect(res.status).to.equal(400);
			expect(res.body.error_code).to.equal('bad_request');
		});
	});

	describe('deleting a category', () => {
		it('should fail with a nonexisting category', async () => {
			const res = await chai.request(server).delete(
				'/api/v1/admin/categories/9999',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(404);
			expect(res.body.error_code).to.equal('not_found');
		});

		it('should return the deleted category and moved items', async () => {
			const res = await chai.request(server).delete(
				'/api/v1/admin/categories/20',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
		});

		it('should move items to the default category', async () => {
			const pre_res = await chai.request(server).get(
				'/api/v1/admin/products',
			).set('Authorization', 'Bearer ' + token);

			expect(pre_res.status).to.equal(200);

			const initial_items = pre_res.body.products.filter((prod) =>
				prod.category.categoryId === 20
			).map((prod) => prod.barcode);

			const res = await chai.request(server).delete(
				'/api/v1/admin/categories/20',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(200);
			expect(res.body.movedProducts.sort()).to.deep.equal(
				initial_items.sort(),
			);

			const post_res = await chai.request(server).get(
				'/api/v1/admin/products',
			).set('Authorization', 'Bearer ' + token);

			expect(post_res.status).to.equal(200);

			post_res.body.products.filter((prod) =>
				initial_items.indexOf(prod.barcode) !== -1
			).forEach((prod) =>
				expect(prod.category.categoryId).to.not.equal(20)
			);
		});

		it('should fail with the default category', async () => {
			const res = await chai.request(server).delete(
				'/api/v1/admin/categories/0',
			).set('Authorization', 'Bearer ' + token);

			expect(res.status).to.equal(403);
			expect(res.body.error_code).to.equal('bad_request');
		});
	});
});
