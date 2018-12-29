const actions = require('../seeddata/ACTION.json');

exports.seed = function(knex, Promise) {
    return knex('ACTION').insert(actions);
};
