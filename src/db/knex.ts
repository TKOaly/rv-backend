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

const knex_original = await Knex(cfg);
/*
	During testing, re-creating database based on migrations is very slow. One trick is to run each testcase in a transaction and then rollback them. However postgresql doesn't support nested transactions, only savepoints. To make knex use savepoints, there must be a top level transaction running. In each testcase we can then create savepoint and rollback after the testcase. This works for our purposes but may break in the future if more complicated testing is performed.
 */
const knex = environment === 'test' ? await knex_original.transaction() : knex_original;

/* In a test environment, a new database is created for every process, so they need to be deleted after the test is run. */
export const test_teardown = async () => {
	// @ts-ignore
	await knex.rollback();
	await knex_original.destroy();
	await drop_database('rv_test_' + process.pid);
};

export default knex;
