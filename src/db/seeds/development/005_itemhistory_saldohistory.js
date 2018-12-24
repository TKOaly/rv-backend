const itemhistory = require('../seeddata/ITEMHISTORY.js');
const saldohistory = require('../seeddata/SALDOHISTORY.js');

exports.seed = function(knex, Promise) {
    return knex('ITEMHISTORY')
        .del()
        .then(() => {
            return knex('SALDOHISTORY').del();
        })
        .then(() => {
            return knex('ITEMHISTORY').insert(itemhistory);
        })
        .then(() => {
            return knex('SALDOHISTORY').insert(saldohistory);
        });
};
