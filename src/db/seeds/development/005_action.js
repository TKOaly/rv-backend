import { actions } from '../seeddata/ACTION.js';

export const seed = async (knex) => {
    await knex('ACTION').insert(actions);
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"ACTION"', 'actionid'),
            coalesce(max(actionid), 0)
        ) from "ACTION"
    `);
};
