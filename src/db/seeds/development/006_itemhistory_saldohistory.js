const itemhistory = require('../seeddata/ITEMHISTORY.js');
const saldohistory = require('../seeddata/SALDOHISTORY.js');

exports.seed = function(knex, Promise) {
    return knex('SALDOHISTORY')
        .insert(saldohistory)
        .then(() => {
            return knex('ITEMHISTORY').insert(itemhistory);
        });
};
