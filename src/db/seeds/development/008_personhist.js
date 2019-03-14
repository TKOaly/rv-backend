const personhist = require('../seeddata/PERSONHIST.js');

exports.seed = function(knex, Promise) {
    return knex('PERSONHIST').insert(personhist);
};
