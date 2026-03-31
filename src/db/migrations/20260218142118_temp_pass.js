export const up = async (knex) => {
	if (!(await knex.schema.hasTable('TEMPPASSWORD'))) {
		await knex.schema.createTable('TEMPPASSWORD', (table) => {
			table.integer('userid')
				.primary()
				.references('userid')
				.inTable('RVPERSON')
				.comment('Reference whose temp password');
			table.string('temp_password', 100).notNullable().comment('Temporary password');
			table.timestamp('created_at', { useTz: true, precision: 6 })
				.notNullable()
				.defaultTo(knex.fn.now());
		});
	}
};

export const down = async (knex) => {
	if (process.env.NODE_ENV !== 'production') {
		await knex.schema.dropTableIfExists('TEMPPASSWORD');
	} else {
		throw new Error('dont drop stuff in production');
	}
};
