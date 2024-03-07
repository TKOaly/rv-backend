exports.up = async (knex) => {
    if (!(await knex.schema.hasTable('PRODGROUP'))) {
        await knex.schema.createTable('PRODGROUP', (table) => {
            table.increments('pgrpid').primary().comment('Product group ID');
            table
                .string('descr', 64)
                .notNullable()
                .comment('Product group description');
        });
    }

    if (!(await knex.schema.hasTable('RVITEM'))) {
        await knex.schema.createTable('RVITEM', (table) => {
            table.increments('itemid').primary().comment('Item ID (unique)');
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
        });
    }
};

exports.down = async (knex) => {
    if (process.env.NODE_ENV !== 'production') {
        await knex.schema
            .dropTableIfExists('RVITEM')
            .dropTableIfExists('PRODGROUP');
    } else {
        throw new Error('dont drop stuff in production');
    }
};
