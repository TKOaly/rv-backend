import knex, {drop_database} from '../src/db/knex.js';

export const test_teardown = async () => {
	await knex.destroy();
	await drop_database('test_' + process.pid);
};
