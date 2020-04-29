const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const knex = require('../../src/db/knex');
const jwt = require('../../src/jwt/token');
const categoryStore = require('../../src/db/categoryStore');

const token = jwt.sign(
    {
        userId: 2
    },
    process.env.JWT_ADMIN_SECRET
);

describe('routes: admin products', () => {
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
                .request(server)
                .get('/api/v1/admin/categories')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('categories');
            expect(res.body.categories).to.be.an('array');
            for (const category of res.body.categories) {
                expect(category).to.have.all.keys('categoryId', 'description');
            }
        });
    });

    describe('Fetching category by id', () => {
        it('should return the category', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/categories/11')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('category');
            expect(res.body.category).to.have.all.keys('categoryId', 'description');
        });

        it('should error on nonexistent category', async () => {
            const res = await chai
                .request(server)
                .get('/api/v1/admin/categories/666')
                .set('Authorization', 'Bearer ' + token);

            expect(res.status).to.equal(404);
        });
    });

    describe('Creating new category', () => {
        it('should create new category', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/categories')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    description: 'Food waste'
                });

            expect(res.status).to.equal(201);

            const newId = res.body.category.categoryId;

            const newCategory = await categoryStore.findById(newId);
            expect(newCategory).to.exist;
            expect(newCategory.description).to.equal('Food waste');
        });

        it('should return the new category', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/categories')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    description: 'Food waste'
                });

            expect(res.status).to.equal(201);

            expect(res.body).to.have.all.keys('category');
            expect(res.body.category).to.have.all.keys('categoryId', 'description');

            expect(res.body.category.description).to.equal('Food waste');
        });

        it('should error on invalid parameters', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/admin/categories')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    abcd: 1
                });

            expect(res.status).to.equal(400);
            expect(res.body.error_code).to.equal('bad_request');
        });
    });

    describe('Modifying category data', () => {
        it('should modify the category', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/categories/20')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    description: 'Radioactive waste'
                });

            expect(res.status).to.equal(200);

            const newCategory = await categoryStore.findById(20);
            expect(newCategory).to.exist;
            expect(newCategory.description).to.equal('Radioactive waste');
        });

        it('should return the updated category', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/categories/20')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    description: 'Radioactive waste'
                });

            expect(res.status).to.equal(200);

            expect(res.body).to.have.all.keys('category');
            expect(res.body.category).to.have.all.keys('categoryId', 'description');

            expect(res.body.category.description).to.equal('Radioactive waste');
        });

        it('should error on nonexistent category', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/categories/88888888')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    description: 'Radioactive waste'
                });

            expect(res.status).to.equal(404);
            expect(res.body.error_code).to.equal('not_found');
        });

        it('should error on invalid parameters', async () => {
            const res = await chai
                .request(server)
                .patch('/api/v1/admin/categories/20')
                .set('Authorization', 'Bearer ' + token)
                .send({
                    description: 5
                });

            expect(res.status).to.equal(400);
            expect(res.body.error_code).to.equal('bad_request');
        });
    });
});
