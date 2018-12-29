const boxes = require('../seeddata/RVBOX.json');

exports.seed = function(knex, Promise) {
    return knex('RVBOX').insert(boxes);
};
