const prodgroups = require('./PRODGROUP.json');
const rvitems = require('./RVITEM.json');

exports.seed = function(knex, Promise) {
    return knex('RVITEM')
        .del()
        .then(() => {
            return knex('PRODGROUP').del();
        })
        .then(() => {
            return knex('RVITEM').del();
        })
        .then(() => {
            return knex('PRODGROUP').insert(prodgroups);
        })
        .then(() => {
            return knex('RVITEM').insert(rvitems);
        });
};
