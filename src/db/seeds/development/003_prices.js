const prices = require('../seeddata/PRICE');

exports.seed = function (knex, Promise) {
    return knex('PRICE')
        .del()
        .then(() => {
            return knex('PRICE').insert(prices);
        });
};