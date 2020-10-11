const knex = require('./knex');
const { DEFAULT_PRODUCT_CATEGORY, getPreference } = require('./preferences');

const rowToCategory = (row) => {
    if (row !== undefined) {
        return {
            categoryId: row.pgrpid,
            description: row.descr
        };
    } else {
        return undefined;
    }
};

/**
 * Returns all categories.
 */
module.exports.getCategories = async () => {
    const data = await knex('PRODGROUP').select('PRODGROUP.pgrpid', 'PRODGROUP.descr');
    return data.map(rowToCategory);
};

/**
 * Finds a category by its id.
 */
module.exports.findById = async (categoryId) => {
    const row = await knex('PRODGROUP')
        .select('PRODGROUP.pgrpid', 'PRODGROUP.descr')
        .where({ pgrpid: categoryId })
        .first();
    return rowToCategory(row);
};

module.exports.insertCategory = async (description) => {
    const insertedRows = await knex('PRODGROUP')
        .insert({ descr: description })
        .returning(['pgrpid']);
    return {
        categoryId: insertedRows[0].pgrpid,
        description: description
    };
};

module.exports.updateCategory = async (categoryId, description) => {
    await knex('PRODGROUP')
        .update({ descr: description })
        .where({ pgrpid: categoryId });
    return {
        categoryId: categoryId,
        description: description
    };
};

module.exports.deleteCategory = async (categoryId, moveProductsTo) => {
    const movedProductIdRows = await knex('RVITEM')
        .where('pgrpid', categoryId)
        .update({
            pgrpid: moveProductsTo
        })
        .returning(['itemid']);

    const movedProductIds = movedProductIdRows.map((row) => row.itemid);

    const movedProducts = await knex('PRICE')
        .where('itemid', 'in', movedProductIds)
        .andWhere('endtime', null)
        .select('barcode');

    const rows = await knex('PRODGROUP')
        .where({ pgrpid: categoryId })
        .delete()
        .returning(['descr']);

    if (rows.length === 0) {
        return undefined;
    }

    const row = rows[0];

    return {
        categoryId,
        description: row.descr,
        movedProducts: movedProducts.map((row) => row.barcode)
    };
};
