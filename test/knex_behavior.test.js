import chai from 'chai';

import knex, { test_teardown } from '../src/db/knex.js';

import { after, afterEach, before, beforeEach, describe, it } from 'node:test';

const expect = chai.expect;

before(async () => {
	await knex.migrate.latest();
	await knex.seed.run();
});

after(async () => {
	await test_teardown();
});

describe('Knex', () => {
	beforeEach(async () => {
		await knex.raw('SAVEPOINT test_begin;');
	});

	afterEach(async () => {
		await knex.raw('ROLLBACK TO SAVEPOINT test_begin;');
	});

	/* Why are we testing this?
	 * Knex has historically returned data in inconsistent formats. See https://github.com/knex/knex/issues/2544.
	 * That should now be fixed but including tests just to be sure. Knex documentation is not good. */

	describe('Selecting', () => {
		it('many columns should return list of objects', async () => {
			const res = await knex('PRODGROUP').select('pgrpid', 'descr');

			expect(res).to.be.an('array');
			expect(res.length).to.be.greaterThan(1);
			expect(res[0]).to.be.an('object');
			expect(res[0]).to.contain.all.keys('pgrpid', 'descr');
			expect(res[0].pgrpid).to.be.a('number');
			expect(res[0].descr).to.be.a('string');
		});

		it('one column should return list of objects', async () => {
			const res = await knex('PRODGROUP').select('pgrpid');

			expect(res).to.be.an('array');
			expect(res.length).to.be.greaterThan(1);
			expect(res[0]).to.be.an('object');
			expect(res[0]).to.contain.all.keys('pgrpid');
			expect(res[0].pgrpid).to.be.a('number');
		});

		it('a datetime should return a Date', async () => {
			const res = await knex('ITEMHISTORY').select('time');

			expect(res).to.be.an('array');
			expect(res.length).to.be.greaterThan(1);
			expect(res[0]).to.be.an('object');
			expect(res[0]).to.contain.all.keys('time');
			expect(res[0].time).to.be.a('date');
		});
	});

	describe('Returning', () => {
		it('many columns should return list of objects', async () => {
			const res = await knex('PRODGROUP').insert({ descr: 'testcategory' }).returning(['pgrpid', 'descr']);

			expect(res).to.be.an('array');
			expect(res.length).to.equal(1);
			expect(res[0]).to.be.an('object');
			expect(res[0]).to.contain.all.keys('pgrpid', 'descr');
			expect(res[0].pgrpid).to.be.a('number');
			expect(res[0].descr).to.be.a('string');
		});

		it('one column should return list of objects', async () => {
			const res = await knex('PRODGROUP').insert({ descr: 'testcategory' }).returning(['pgrpid']);

			expect(res).to.be.an('array');
			expect(res.length).to.equal(1);
			expect(res[0]).to.be.an('object');
			expect(res[0]).to.contain.all.keys('pgrpid');
			expect(res[0].pgrpid).to.be.a('number');
		});

		it('one column without array syntax should return list of objects', async () => {
			const res = await knex('PRODGROUP').insert({ descr: 'testcategory' }).returning('pgrpid');

			expect(res).to.be.an('array');
			expect(res.length).to.equal(1);
			expect(res[0]).to.be.an('object');
			expect(res[0]).to.contain.all.keys('pgrpid');
			expect(res[0].pgrpid).to.be.a('number');
		});

		it('a datetime should return a Date', async () => {
			const now = new Date();
			const res = await knex('ITEMHISTORY').update({ time: now }).where({ itemhistid: 3 }).returning(['time']);

			expect(res).to.be.an('array');
			expect(res.length).to.be.equal(1);
			expect(res[0]).to.be.an('object');
			expect(res[0]).to.contain.all.keys('time');
			expect(res[0].time).to.be.a('date');
			expect(res[0].time.getTime()).to.equal(now.getTime());
		});
	});
});
