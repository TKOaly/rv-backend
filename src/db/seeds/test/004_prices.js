const prices = require('../seeddata/PRICE.js');

exports.seed = async (knex) => {
    await knex('PRICE').insert(prices.filter((p) => p.itemid >= 1750));
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"PRICE"', 'priceid'),
            coalesce(max(priceid), 0)
        ) from "PRICE"
    `);
};
