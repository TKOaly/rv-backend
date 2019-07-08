exports.up = async (knex) => {
    if (!(await knex.schema.hasTable('ACTION'))) {
        await knex.schema.createTable('ACTION', (table) => {
            table
                .increments('actionid')
                .primary()
                .comment('Action ID');
            table
                .string('action', 64)
                .notNullable()
                .comment('Description of action');
        });
    }
};

exports.down = async (knex) => {
    if (process.env.NODE_ENV !== 'production') {
        await knex.schema.dropTableIfExists('ACTION');
    } else {
        throw new Error('dont drop stuff in production');
    }
};
