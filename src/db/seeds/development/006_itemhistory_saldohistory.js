import { itemhistory } from '../seeddata/ITEMHISTORY.js';
import { saldohistory } from '../seeddata/SALDOHISTORY.js';

export const seed = async (knex) => {
    await knex('SALDOHISTORY').insert(saldohistory);
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"SALDOHISTORY"', 'saldhistid'),
            coalesce(max(saldhistid), 0)
        ) from "SALDOHISTORY"
    `);
    await knex('ITEMHISTORY').insert(itemhistory);
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"ITEMHISTORY"', 'itemhistid'),
            coalesce(max(itemhistid), 0)
        ) from "ITEMHISTORY"
    `);
};
