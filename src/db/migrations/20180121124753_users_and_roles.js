exports.up = function(knex, Promise) {
    return knex.schema
        .hasTable('ROLE')
        .then((exists) => {
            if (!exists) {
                return knex.schema.createTable('ROLE', (table) => {
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
        })
        .then(() => {
            return knex.schema.hasTable('RVPERSON').then((exists) => {
                if (!exists) {
                    return knex.schema.createTable('RVPERSON', (table) => {
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
            });
        });
};

exports.down = function(knex, Promise) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('dont drop stuff in production');
    } else {
        return knex.schema.dropTableIfExists('RVPERSON').dropTableIfExists('ROLE');
    }
};
