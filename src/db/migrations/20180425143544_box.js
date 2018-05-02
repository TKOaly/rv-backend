
exports.up = function(knex, Promise) {
    return knex.schema.hasTable('RVBOX').then(exists => {
        if (!exists) {
            return knex.schema.createTable('RVBOX', table => {
                table
                    .string('barcode', 64)
                    .notNullable()
                    .primary()
                    .comment('Box barcode. This is considered unique and there is no other ID');
                table
                    .string('itembarcode', 64)
                    .notNullable()
                    .index()
                    .comment('Barcode of items contained in this box');
                table
                    .integer('itemcount')
                    .nullable()
                    .comment('Count of items in this box');
            });
        }
    }).then(() => {
        return knex.schema.hasTable('BOXHISTORY').then(exists => {
            if (!exists) {
                return knex.schema.createTable('BOXHISTORY', table => {
                    table
                        .increments('boxhistory_id')
                        .primary()
                        .notNullable()
                        .comment('Box history ID');
                    table
                        .dateTime('time')
                        .notNullable()
                        .comment('When box properties changed');
                    table
                        .string('barcode')
                        .notNullable()
                        .comment('Box barcode. This is considered unique and there is no other ID');
                    table
                        .integer('itemid')
                        .nullable()
                        .index()
                        .references('itemid')
                        .inTable('RVITEM')
                        .comment('Reference to item contained in this box');
                    table
                        .integer('itemcount')
                        .nullable()
                        .comment('Count of items in this box AFTER an action affecting it occurred');
                    table
                        .integer('userid')
                        .notNullable()
                        .index()
                        .references('userid')
                        .inTable('RVPERSON')
                        .comment('Reference to user who made the change');
                    table
                        .integer('actionid')
                        .notNullable()
                        .references('actionid')
                        .inTable('ACTION')
                        .comment('Reference to action that was made');
                });
            }
        });
    });
};

exports.down = function(knex, Promise) {
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTable('BOXHISTORY')
            .then(() => knex.schema.dropTable('RVBOX'));
    } else {
        throw new Error('don\'t drop stuff in production');
    }
};
