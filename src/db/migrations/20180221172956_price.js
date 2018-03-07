exports.up = function(knex, Promise) {
    return knex.schema
        .createTableIfNotExists('PRICE', function (table) {
            table
                .increments('priceid')
                .unsigned()
                .primary()
                .comment('Price ID');
            table
                .string('barcode')
                .notNullable()
                .index()
                .comment('Barcode associated with some item and its price');
            table
                .integer('count')
                .notNullable()
                .comment('How many items of this price we have on stock');
            table
                .integer('buyprice')
                .notNullable()
                .comment('Buy price, possible negative, cents (or other indivisible units of money)');
            table
                .integer('sellprice')
                .notNullable()
                .comment('Sell price, possibly negative, cents (or other indivisible units of money)');
            table
                .integer('itemid')
                .unsigned()
                .notNullable()
                .comment('Reference to item this price relates to')
                .references('itemid')
                .inTable('RVITEM');
            table
                .integer('userid')
                .unsigned()
                .notNullable()
                .comment('Reference to user ID who created this price')
                .references('userid')
                .inTable('RVPERSON');
            table
                .dateTime('starttime')
                .nullable()
                .index()
                .comment('When price has become valid. May be NULL if price differs from current price and there is old stock.');
            table
                .dateTime('endtime')
                .nullable()
                .index()
                .comment('When price became invalid (items on stock count reaches zero, unless this is last valid price).');
        });
};

exports.down = function(knex, Promise) {
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('PRICE');
    } else {
        throw new Error('dont drop stuff in production');
    }
};
