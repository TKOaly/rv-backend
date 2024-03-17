import { default as Knex } from 'knex';
import pkg from 'pg';
import config from '../../knexfile.js';
const { Client } = pkg;

const environment = process.env.NODE_ENV || 'development';
const cfg = config[environment];

const drop_database = async (db_name) => {
	const client = new Client({
		host: cfg.connection.host,
		port: cfg.connection.port,
		database: 'postgres',
		user: cfg.connection.user,
		password: cfg.connection.password,
	});
	await client.connect();
	await client.query('DROP DATABASE ' + db_name);
	await client.end();
};

const create_database = async (db_name) => {
	const client = new Client({
		host: cfg.connection.host,
		port: cfg.connection.port,
		database: 'postgres',
		user: cfg.connection.user,
		password: cfg.connection.password,
	});
	await client.connect();
	await client.query('DROP DATABASE IF EXISTS ' + db_name);
	await client.query('CREATE DATABASE ' + db_name);
	await client.end();
};

/* In test environment, a new database is created for every process to allow parallel test runs. In development and
 * production environments there is already a single database per environment */
if (environment === 'test') {
	// Each test runs in its own separate process, use pid to avoid db conflicts.
	const db_name = 'rv_test_' + process.pid;
	await create_database(db_name);
	cfg.connection.database = db_name;
}

const knex = Knex(cfg);

/* In test environment, a new database is created for every process, so they need to be deleted after the test is run. */
export const test_teardown = async () => {
	await knex.destroy();
	await drop_database('rv_test_' + process.pid);
};

export default knex;
