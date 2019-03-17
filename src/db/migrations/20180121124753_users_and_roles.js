exports.up = async (knex) => {
    if (!(await knex.schema.hasTable('ROLE'))) {
        await knex.schema.createTable('ROLE', (table) => {
            table.increments('roleid').primary();
            table.string('role', 32).notNullable();
            table
                .integer('buzzerlimit')
                .notNullable()
                .defaultTo(-1000);
            table
                .integer('fgcolor')
                .notNullable()
                .defaultTo(37);
            table
                .integer('bgcolor')
                .notNullable()
                .defaultTo(40);
        });
    }

    if (!(await knex.schema.hasTable('RVPERSON'))) {
        await knex.schema.createTable('RVPERSON', (table) => {
            table.increments('userid').primary();
            table.dateTime('createdate').notNullable();
            table
                .integer('roleid')
                .notNullable()
                .references('roleid')
                .inTable('ROLE');
            table
                .string('name', 64)
                .notNullable()
                .index();
            table.string('univident', 128).notNullable();
            table.string('pass', 100).notNullable();
            table.integer('saldo').notNullable();
            table.string('realname', 128);
            table.unique('name');
            table.unique('univident');
        });
    }
};

exports.down = async (knex) => {
    if (process.env.NODE_ENV !== 'production') {
        await knex.schema.dropTableIfExists('RVPERSON').dropTableIfExists('ROLE');
    } else {
        throw new Error('dont drop stuff in production');
    }
};
