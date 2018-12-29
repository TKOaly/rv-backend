exports.up = function(knex, Promise) {
    return knex.schema.hasTable('PERSONHIST').then((exists) => {
        if (!exists) {
            return knex.schema.createTable('PERSONHIST', (table) => {
                table.increments('pershistid').primary();
                table
                    .dateTime('time')
                    .notNullable()
                    .index();
                table.string('ipaddress').defaultTo(null);
                table
                    .integer('actionid')
                    .notNullable()
                    .references('actionid')
                    .inTable('ACTION');
                table
                    .integer('userid1')
                    .notNullable()
                    .references('userid')
                    .inTable('RVPERSON');
                table
                    .integer('userid2')
                    .notNullable()
                    .references('userid')
                    .inTable('RVPERSON');
            });
        }
    });
};

exports.down = function(knex, Promise) {
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('PERSONHIST');
    } else {
        throw new Error('dont drop stuff in production');
    }
};
