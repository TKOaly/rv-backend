const boxes = require('../seeddata/RVBOX.json');

exports.seed = function(knex, Promise) {
    return knex('RVBOX')
        .del()
        .then(function() {
            return knex('RVBOX').insert(boxes);
        });
};
