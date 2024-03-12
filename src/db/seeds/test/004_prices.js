import { prices } from '../seeddata/PRICE.js';

export const seed = async (knex) => {
    await knex('PRICE').insert(prices);
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"PRICE"', 'priceid'),
            coalesce(max(priceid), 0)
        ) from "PRICE"
    `);
};
