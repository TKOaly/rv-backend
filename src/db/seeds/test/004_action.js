const actions = require('../seeddata/ACTION.json');

exports.seed = function(knex, Promise) {
    return knex('ACTION')
        .del()
        .then(() => {
            return knex('ACTION').insert(actions);
        });
};
