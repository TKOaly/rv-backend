import knex, { drop_database } from '../src/db/knex.js';

export const test_teardown = async () => {
	await new Promise((res) => {
		knex.destroy(() => {
			drop_database('test_' + process.pid).then(res);
		});
	});
};
