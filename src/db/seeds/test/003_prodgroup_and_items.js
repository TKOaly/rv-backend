const prodgroups = require('../seeddata/PRODGROUP.json');
const rvitems = require('../seeddata/RVITEM.json');

exports.seed = async (knex) => {
	await knex('PRODGROUP_ALL').insert(prodgroups);
	await knex.raw(`
        select setval(
            pg_get_serial_sequence('"PRODGROUP_ALL"', 'pgrpid'),
            coalesce(max(pgrpid), 0)
        ) from "PRODGROUP_ALL"
    `);
	await knex('RVITEM').insert(rvitems);
	await knex.raw(`
        select setval(
            pg_get_serial_sequence('"RVITEM"', 'itemid'),
            coalesce(max(itemid), 0)
        ) from "RVITEM"
    `);
};
