const itemhistory = require('../seeddata/ITEMHISTORY.js');

exports.seed = function(knex, Promise) {
    return knex('ITEMHISTORY')
        .del()
        .then(() => {
            return knex('ITEMHISTORY').insert(itemhistory);
        });
};
