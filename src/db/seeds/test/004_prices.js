const prices = require('../seeddata/PRICE');

exports.seed = function(knex, Promise) {
    return knex('PRICE').insert(prices.filter((p) => p.itemid >= 1750));
};
