exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('ITEMHISTORY', function(table) {
        table
            .increments('itemhistid')
            .unsigned()
            .primary()
            .comment('Item history ID');
        table
            .dateTime('time')
            .notNullable()
            .comment(
                'When item properties changed (buy-transactions NOT recorded here)'
            );
        table
            .integer('count')
            .unsigned()
            .defaultTo(null);
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
                'Reference to currently related price or priceid that is obsoleted'
            )
            .references('priceid')
            .inTable('PRICE');
        table
            .integer('priceid2')
            .notNullable()
            .unsigned()
            .comment('Reference to user who made the change')
            .references('priceid')
            .inTable('PRICE');
    });
};

exports.down = function(knex, Promise) {
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('ITEMHISTORY');
    } else {
        throw new Error('dont drop stuff in production');
    }
};
