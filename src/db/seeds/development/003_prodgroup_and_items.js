const prodgroups = require('../seeddata/PRODGROUP.json');
const rvitems = require('../seeddata/RVITEM.json');

exports.seed = function(knex, Promise) {
    return knex('PRODGROUP')
        .insert(prodgroups)
        .then(() => {
            return knex('RVITEM').insert(rvitems);
        });
};
