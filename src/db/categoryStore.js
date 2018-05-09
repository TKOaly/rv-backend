const knex = require('./knex');

/**
 * Finds a category by its id.
 *
 * @param {*} id id of the category
 * @returns category information if found, null otherwise
 */
module.exports.findById = async pgrpid =>
    knex('PRODGROUP')
        .select('PRODGROUP.pgrpid', 'PRODGROUP.descr')
        .where({ pgrpid })
        .first();

/**
 * Returns all categories.
 *
 */
module.exports.findAllCategories = () =>
    knex('PRODGROUP').select('PRODGROUP.pgrpid', 'PRODGROUP.descr');
