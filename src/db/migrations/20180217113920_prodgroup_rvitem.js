exports.up = function(knex, Promise) {
    return knex.schema
        .createTableIfNotExists('PRODGROUP', function(table) {
            table
                .integer('pgrpid')
                .unsigned()
                .primary()
                .notNullable()
                .comment('Product group ID');
            table
                .string('descr', 64)
                .notNullable()
                .comment('Product group description');
        })
        .createTableIfNotExists('RVITEM', function(table) {
            table
                .integer('itemid')
                .unsigned()
                .primary()
                .notNullable()
                .comment('Item ID (unique)');
            table
                .integer('pgrpid')
                .unsigned()
                .notNullable()
                .comment('Reference to product group of this item')
                .references('pgrpid')
                .inTable('PRODGROUP');
            table
                .string('descr', 64)
                .notNullable()
                .comment('Textual product description (name)');
            table
                .integer('weight')
                .unsigned()
                .notNullable()
                .comment('Product weight');
        });
};

exports.down = function(knex, Promise) {
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema
            .dropTableIfExists('RVITEM')
            .dropTableIfExists('PRODGROUP');
    }
};
