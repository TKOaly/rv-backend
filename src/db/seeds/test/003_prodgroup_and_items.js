const prodgroups = require('../seeddata/PRODGROUP.json');
const rvitems = require('../seeddata/RVITEM.json');

exports.seed = async (knex) => {
    await knex('PRODGROUP').insert(prodgroups);
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"PRODGROUP"', 'pgrpid'),
            coalesce(max(pgrpid), 0)
        ) from "PRODGROUP"
    `);
    await knex('RVITEM').insert(rvitems.filter((item) => item.itemid >= 1750));
    await knex.raw(`
        select setval(
            pg_get_serial_sequence('"RVITEM"', 'itemid'),
            coalesce(max(itemid), 0)
        ) from "RVITEM"
    `);
};
