const prodgroups = require('../seeddata/PRODGROUP.json');
const rvitems = require('../seeddata/RVITEM.json');

exports.seed = function(knex, Promise) {
    return knex('RVITEM')
        .del()
        .then(() => {
            return knex('PRODGROUP').del();
        })
        .then(() => {
            return knex('PRODGROUP').insert(prodgroups);
        })
        .then(() => {
            rvitems.forEach((item) => knex('RVITEM').insert(item));
            return knex;
        });
};
