const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

const openapiValidator = require('./openapiValidator');
const server = require('../src/app');
const knex = require('../src/db/knex');
const userStore = require('../src/db/userStore');

chai.use(openapiValidator);
chai.use(chaiHttp);

describe('routes: register', () => {
    beforeEach(async () => {
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
    });

    describe('Trying to register with missing field or bad password etc', () => {
        it('Request should not have missing keys', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/register')
                .send({
                    // empty string
                });

            expect(res.status).to.equal(400);
            expect(res.body.error_code).to.equal('bad_request');
            expect(res).to.satisfyApiSpec;
        });

        it('Username should not be empty', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/register')
                .send({
                    username: '',
                    password: 'test',
                    fullName: 'm.erkki',
                    email: 'erkki@testi.com'
                });

            expect(res.status).to.equal(400);
            expect(res.body.error_code).to.equal('bad_request');
            expect(res).to.satisfyApiSpec;
        });

        it('User password should not be empty', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/register')
                .send({
                    username: 'test',
                    password: '',
                    fullName: 'm.erkki',
                    email: 'erkki@testi.com'
                });

            expect(res.status).to.equal(400);
            expect(res.body.error_code).to.equal('bad_request');
            expect(res).to.satisfyApiSpec;
        });
    });

    describe('Usernames and Emails should be uniques', () => {
        it('Username should be unique', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/register')
                .send({
                    username: 'normal_user',
                    password: 'test',
                    fullName: 'm.erkki',
                    email: 'erkki@testi.com'
                });

            expect(res.status).to.equal(409);
            expect(res.body.error_code).to.equal('identifier_taken');
            expect(res).to.satisfyApiSpec;
        });

        it('Email should be unique', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/register')
                .send({
                    username: 'test',
                    password: 'test',
                    fullName: 'm.erkki',
                    email: 'user@example.com'
                });

            expect(res.status).to.equal(409);
            expect(res.body.error_code).to.equal('identifier_taken');
            expect(res).to.satisfyApiSpec;
        });
    });

    describe('User should be able to register to service', () => {
        it('With all required fields user should be registered to service', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/register')
                .send({
                    username: 'test',
                    password: 'test',
                    fullName: 'm.erkki',
                    email: 'erkki@test.com'
                });

            expect(res.status).to.equal(201);
            expect(res).to.satisfyApiSpec;
        });

        it('Registering should create a new user to the database', async () => {
            const res = await chai
                .request(server)
                .post('/api/v1/register')
                .send({
                    username: 'abc',
                    password: 'def',
                    fullName: 'No Body',
                    email: 'person@email.com'
                });

            expect(res.status).to.equal(201);

            const user = await userStore.findByUsername('abc');
            expect(user).to.exist;
        });
    });
});
