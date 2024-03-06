exports.up = async (knex) => {
    if (!(await knex.schema.hasTable('PERSONHIST'))) {
        await knex.schema.createTable('PERSONHIST', (table) => {
            table.increments('pershistid').primary();
            table.dateTime('time').notNullable().index();
            table.string('ipaddress').defaultTo(null);
            table.integer('actionid').notNullable().references('actionid').inTable('ACTION');
            table.integer('userid1').notNullable().references('userid').inTable('RVPERSON');
            table.integer('userid2').notNullable().references('userid').inTable('RVPERSON');
        });
    }
};

exports.down = async (knex) => {
    if (process.env.NODE_ENV !== 'production') {
        await knex.schema.dropTableIfExists('PERSONHIST');
    } else {
        throw new Error('dont drop stuff in production');
    }
};
