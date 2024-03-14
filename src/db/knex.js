import { default as Knex } from 'knex';
import pkg from 'pg';
import config from '../../knexfile.js';
const { Client } = pkg;

const environment = process.env.NODE_ENV || 'development';

export const drop_database = async (db_name) => {
	const cfg = config[environment];
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
	cfg.connection.database = db_name;
};

const cfg = config[environment];

if (environment == 'test') {
	// Each test runs in its own separate process, use pid to avoid db conflicts.
	const db_name = 'test_' + process.pid;

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
	cfg.connection.database = db_name;
}
const knex = Knex(cfg);

export default knex;
