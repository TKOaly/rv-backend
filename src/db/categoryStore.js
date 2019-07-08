const knex = require('./knex');

/**
 * Finds a category by its id.
 *
 * @param {*} id id of the category
 * @returns category information if found, null otherwise
 */
module.exports.findById = async (pgrpid) => {
    return await knex('PRODGROUP')
        .select('PRODGROUP.pgrpid', 'PRODGROUP.descr')
        .where({ pgrpid: pgrpid })
        .first();
};

/**
 * Returns all categories.
 *
 */
module.exports.findAllCategories = async () => {
    return await knex('PRODGROUP').select('PRODGROUP.pgrpid', 'PRODGROUP.descr');
};
