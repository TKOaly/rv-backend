import chai from 'chai';

const expect = chai.expect;

import { describe, it } from 'node:test';

describe('NODE_ENV', () => {
	it('should be test in test environment', async () => {
		expect(process.env.NODE_ENV).to.equal('test');
	});
});
