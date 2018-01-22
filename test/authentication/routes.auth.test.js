process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test secret';

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const request = chai.request(server);
const knex = require('../../src/db/knex.js');

describe('routes: authentication', () => {

  beforeEach((done) => {
    knex.migrate.rollback()
    .then(() => {
      knex.migrate.latest()
      .then(() => {
        knex.seed.run()
        .then(() => {
          done();
        });
      });
    });
  });

  afterEach((done) => {
    knex.migrate.rollback()
    .then(() => {
      done();
    });
  });
  
  describe('POST /api/v1/auth/authenticate', () => {

    it('with valid credentials, should respond with an authentication token', (done) => {
      chai.request(server)
      .post('/api/v1/auth/authenticate')
      .type('form')
      .send({
        username: 'testuser',
        password: 'hunter2'
      })
      .end((err, res) => {
        should.not.exist(err)
        res.status.should.equal(200);
        should.exist(res.body.access_token);
        done();
      });
    });

    it('with invalid credentials, should return a 403 forbidden response', (done) => {
      chai.request(server)
      .post('/api/v1/auth/authenticate')
      .type('form')
      .send({
        username: 'testuser',
        password: 'incorrect'
      })
      .end((err, res) => {
        should.exist(err)
        res.status.should.equal(403);
        done();
      });
    });

    it('invalid request should result in a 400 bad request response', (done) => {
      chai.request(server)
      .post('/api/v1/auth/authenticate')
      .type('form')
      .send('garbage')
      .end((err, res) => {
        should.exist(err);
        res.status.should.equal(400);
        done();
      });
    });

  });
});