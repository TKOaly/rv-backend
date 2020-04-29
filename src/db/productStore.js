const knex = require('./knex');
const deleteUndefinedFields = require('../utils/objectUtils').deleteUndefinedFields;

const rowToProduct = (row) => {
    if (row !== undefined) {
        return {
            barcode: row.barcode,
            productId: row.itemid,
            name: row.descr,
            category: {
                categoryId: row.pgrpid,
                description: row.pgrpdescr
            },
            weight: row.weight,
            buyPrice: row.buyprice,
            sellPrice: row.sellprice,
            stock: row.count
        };
    } else {
        return undefined;
    }
};

/**
 * Returns all products and their stock quantities, if available.
 *
 */
module.exports.getProducts = async () => {
    const data = await knex('PRICE')
        .leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
        .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
        .select(
            'RVITEM.itemid',
            'RVITEM.descr',
            'RVITEM.pgrpid',
            'PRODGROUP.descr as pgrpdescr',
            'RVITEM.weight',
            'PRICE.barcode',
            'PRICE.buyprice',
            'PRICE.sellprice',
            'PRICE.count'
        )
        .where('PRICE.endtime', null);
    return data.map(rowToProduct);
};

/**
 * Finds a product by its barcode.
 */
module.exports.findByBarcode = async (barcode) => {
    const row = await knex('PRICE')
        .leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
        .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
        .select(
            'RVITEM.itemid',
            'RVITEM.descr',
            'RVITEM.pgrpid',
            'PRODGROUP.descr as pgrpdescr',
            'RVITEM.weight',
            'PRICE.barcode',
            'PRICE.buyprice',
            'PRICE.sellprice',
            'PRICE.count'
        )
        .where('PRICE.barcode', barcode)
        .andWhere('PRICE.endtime', null)
        .first();
    return rowToProduct(row);
};

/**
 * Finds a product by its id.
 */
module.exports.findById = async (productId) => {
    const row = await knex('PRICE')
        .leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
        .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
        .select(
            'RVITEM.itemid',
            'RVITEM.descr',
            'RVITEM.pgrpid',
            'PRODGROUP.descr as pgrpdescr',
            'RVITEM.weight',
            'PRICE.barcode',
            'PRICE.buyprice',
            'PRICE.sellprice',
            'PRICE.count'
        )
        .where('RVITEM.itemid', productId)
        .andWhere('PRICE.endtime', null)
        .first();
    return rowToProduct(row);
};

/**
 * Creates a new product if given barcode is not in use.
 *
 */
module.exports.insertProduct = async (productData, userId) => {
    return await knex.transaction(async (trx) => {
        const insertedRows = await knex('RVITEM')
            .transacting(trx)
            .insert({
                pgrpid: productData.categoryId,
                descr: productData.name,
                weight: productData.weight
            })
            .returning(['itemid']);

        await knex('PRICE')
            .transacting(trx)
            .insert({
                barcode: productData.barcode,
                count: productData.stock,
                buyprice: productData.buyPrice,
                sellprice: productData.sellPrice,
                itemid: insertedRows[0].itemid,
                userid: userId,
                starttime: new Date(),
                endtime: null
            });

        const categoryRow = await knex('PRODGROUP')
            .transacting(trx)
            .select('descr')
            .where('pgrpid', productData.categoryId)
            .first();

        return {
            barcode: productData.barcode,
            productId: insertedRows[0].itemid,
            name: productData.name,
            category: {
                categoryId: productData.categoryId,
                description: categoryRow.descr
            },
            weight: productData.weight,
            buyPrice: productData.buyPrice,
            sellPrice: productData.sellPrice,
            stock: productData.stock
        };
    });
};

/**
 * Updates a product's information
 */
module.exports.updateProduct = async (barcode, productData, userId) => {
    /* productData may have fields { name, categoryId, weight, buyPrice, sellPrice, stock } */
    return await knex.transaction(async (trx) => {
        const rvitemFields = deleteUndefinedFields({
            pgrpid: productData.categoryId,
            descr: productData.name,
            weight: productData.weight
        });
        if (Object.keys(rvitemFields).length > 0) {
            const priceRow = await knex('PRICE')
                .transacting(trx)
                .select('itemid')
                .where({ barcode: barcode, endtime: null })
                .first();

            await knex('RVITEM')
                .transacting(trx)
                .update(rvitemFields)
                .where({ itemid: priceRow.itemid });
        }

        const priceFields = deleteUndefinedFields({
            count: productData.stock,
            buyprice: productData.buyPrice,
            sellprice: productData.sellPrice
        });
        if (Object.keys(priceFields).length > 0) {
            if (priceFields.sellPrice === undefined) {
                await knex('PRICE')
                    .transacting(trx)
                    .update(priceFields)
                    .where({ barcode: barcode, endtime: null });
            } else {
                /* Sell price changed, a new price row will be created. */
                const now = new Date();

                const currentPriceRows = await knex('PRICE')
                    .transacting(trx)
                    .update({ endtime: now })
                    .where({ barcode: barcode, endtime: null })
                    .returning('*');

                await knex('PRICE')
                    .transacting(trx)
                    .insert({
                        barcode: currentPriceRows[0].barcode,
                        count: currentPriceRows[0].count,
                        buyprice: currentPriceRows[0].buyprice,
                        sellprice: currentPriceRows[0].sellprice,
                        itemid: currentPriceRows[0].itemid,
                        userid: userId,
                        starttime: now,
                        endtime: null,

                        ...priceFields
                    });
            }
        }

        const productRow = await knex('PRICE')
            .transacting(trx)
            .leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
            .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
            .select(
                'RVITEM.itemid',
                'RVITEM.descr',
                'RVITEM.pgrpid',
                'PRODGROUP.descr as pgrpdescr',
                'RVITEM.weight',
                'PRICE.barcode',
                'PRICE.buyprice',
                'PRICE.sellprice',
                'PRICE.count'
            )
            .where('PRICE.barcode', barcode)
            .andWhere('PRICE.endtime', null)
            .first();
        return rowToProduct(productRow);
    });
};

/**
 * Records a product purchase in the database.
 */
module.exports.recordPurchase = async (barcode, userId, count) => {
    return await knex.transaction(async (trx) => {
        const now = new Date();

        const updatedPriceRows = await knex('PRICE')
            .transacting(trx)
            .where({ barcode: barcode, endtime: null })
            .decrement({ count: count })
            .returning(['priceid', 'itemid', 'sellprice', 'count']);

        const priceId = updatedPriceRows[0].priceid;
        const productId = updatedPriceRows[0].itemid;
        const price = updatedPriceRows[0].sellprice;
        const stockBefore = updatedPriceRows[0].count + count;

        const updatedPersonRows = await knex('RVPERSON')
            .transacting(trx)
            .where({ userid: userId })
            .decrement({ saldo: count * price })
            .returning(['saldo']);

        const balanceBefore = updatedPersonRows[0].saldo + count * price;

        let stock = stockBefore;
        let balance = balanceBefore;
        const insertedHistory = [];

        /* Storing multibuy into history as multiple individual history events. */
        for (let i = 0; i < count; i++) {
            stock--;
            balance -= price;

            const insertedSaldhistRows = await knex('SALDOHISTORY')
                .transacting(trx)
                .insert({
                    userid: userId,
                    time: now,
                    saldo: balance,
                    difference: -price
                })
                .returning(['saldhistid']);
            const insertedItemhistRows = await knex('ITEMHISTORY')
                .transacting(trx)
                .insert({
                    time: now,
                    count: stock,
                    actionid: 5,
                    itemid: productId,
                    userid: userId,
                    priceid1: priceId,
                    saldhistid: insertedSaldhistRows[0].saldhistid
                })
                .returning(['itemhistid']);

            /* Storing inserted history events so they can be returned. */
            insertedHistory.push({
                purchaseId: insertedItemhistRows[0].itemhistid,
                time: now.toISOString(),
                price: price,
                balanceAfter: balance,
                stockAfter: stock
            });
        }

        return insertedHistory;
    });
};
