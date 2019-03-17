exports.up = function(knex, Promise) {
    return knex.schema
        .hasTable('PRODGROUP')
        .then((exists) => {
            if (!exists) {
                return knex.schema.createTable('PRODGROUP', (table) => {
                    table
                        .increments('pgrpid')
                        .primary()
                        .comment('Product group ID');
                    table
                        .string('descr', 64)
                        .notNullable()
                        .comment('Product group description');
                });
            }

            return knex;
        })
        .then(() => {
            return knex.schema.hasTable('RVITEM').then((exists) => {
                if (!exists) {
                    return knex.schema.createTable('RVITEM', (table) => {
                        table
                            .increments('itemid')
                            .primary()
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
                }
            });
        });
};

exports.down = function(knex, Promise) {
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('RVITEM').dropTableIfExists('PRODGROUP');
    }
};
