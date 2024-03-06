exports.up = async (knex) => {
    if (!(await knex.schema.hasTable('ITEMHISTORY'))) {
        await knex.schema.createTable('ITEMHISTORY', (table) => {
            table.increments('itemhistid').primary().comment('Item history ID');
            table
                .dateTime('time')
                .notNullable()
                .index()
                .comment(
                    'When item properties changed (buy-transactions NOT recorded here)',
                );
            table.integer('count').defaultTo(null);
            table
                .integer('actionid')
                .notNullable()
                .unsigned()
                .comment('Reference to action that was made')
                .references('actionid')
                .inTable('ACTION');
            table
                .integer('itemid')
                .notNullable()
                .unsigned()
                .comment('Reference to item which had its properties changed')
                .references('itemid')
                .inTable('RVITEM');
            table
                .integer('userid')
                .notNullable()
                .unsigned()
                .comment('Reference to user who made the change')
                .references('userid')
                .inTable('RVPERSON');
            table
                .integer('priceid1')
                .notNullable()
                .unsigned()
                .comment(
                    'Reference to currently related price or priceid that is obsoleted',
                )
                .references('priceid')
                .inTable('PRICE');
            table
                .integer('priceid2')
                .unsigned()
                .comment('Reference to new price if action was to change price')
                .references('priceid')
                .inTable('PRICE')
                .defaultTo(null);
        });
    }

    if (!(await knex.schema.hasTable('SALDOHISTORY'))) {
        await knex.schema.createTable('SALDOHISTORY', (table) => {
            table.increments('saldhistid').primary();
            table
                .integer('userid')
                .notNullable()
                .references('userid')
                .inTable('RVPERSON');
            table.dateTime('time').notNullable().index();
            table.integer('saldo').index();
            table.integer('difference').notNullable();
        });
    }
};

exports.down = async (knex) => {
    if (process.env.NODE_ENV !== 'production') {
        await knex.schema
            .dropTableIfExists('ITEMHISTORY')
            .dropTableIfExists('SALDOHISTORY');
    } else {
        throw new Error('dont drop stuff in production');
    }
};
