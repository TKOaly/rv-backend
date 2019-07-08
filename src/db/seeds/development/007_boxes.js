const boxes = require('../seeddata/RVBOX.json');

exports.seed = async (knex) => {
    await knex('RVBOX').insert(boxes);
};
