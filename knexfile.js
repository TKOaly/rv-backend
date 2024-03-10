module.exports = {
	development: {
		client: 'pg',
		connection: {
			host: process.env.DB_HOST,
			user: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME + '_dev',
			port: process.env.DB_PORT,
		},
		migrations: { directory: __dirname + '/src/db/migrations' },
		seeds: { directory: __dirname + '/src/db/seeds/development' },
	},

	test: {
		client: 'pg',
		connection: {
			host: process.env.DB_HOST,
			user: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME + '_test',
			port: process.env.DB_PORT,
		},
		migrations: { directory: __dirname + '/src/db/migrations' },
		seeds: { directory: __dirname + '/src/db/seeds/test' },
	},

	production: {
		client: 'pg',
		connection: {
			host: process.env.DB_HOST,
			user: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			port: process.env.DB_PORT,
		},
		migrations: { directory: __dirname + '/src/db/migrations' },
		seeds: { directory: __dirname + '/src/db/seeds/production' },
	},
};
