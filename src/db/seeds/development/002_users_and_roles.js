const roles = require('../seeddata/ROLE.json');
const rvpersons = require('../seeddata/RVPERSON.js');

exports.seed = async (knex) => {
	await knex('ROLE').insert(roles);
	await knex.raw(`
        select setval(
            pg_get_serial_sequence('"ROLE"', 'roleid'),
            coalesce(max(roleid), 0)
        ) from "ROLE"
    `);
	await knex('RVPERSON').insert(rvpersons);
	await knex.raw(`
        select setval(
            pg_get_serial_sequence('"RVPERSON"', 'userid'),
            coalesce(max(userid), 0)
        ) from "RVPERSON"
    `);
};
