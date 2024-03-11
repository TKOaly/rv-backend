import { personhist } from '../seeddata/PERSONHIST.js';

export const seed = async (knex) => {
    await knex('PERSONHIST').insert(personhist);
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"PERSONHIST"', 'pershistid'),
            coalesce(max(pershistid), 0)
        ) from "PERSONHIST"
    `);
};
