const knex = require('./knex');

/**
 * Finds a product by its barcode.
 *
 * @param {string} barcode barcode of the product
 * @returns product and price information if found, null otherwise
 */
module.exports.findByBarcode = async (barcode) => {
    return knex('PRICE')
        .leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
        .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
        .select(
            'RVITEM.itemid',
            'RVITEM.descr',
            'RVITEM.pgrpid',
            'PRODGROUP.descr as pgrpdescr',
            'RVITEM.weight',
            'PRICE.priceid',
            'PRICE.barcode',
            'PRICE.buyprice',
            'PRICE.sellprice',
            'PRICE.count'
        )
        .where('PRICE.barcode', barcode)
        .andWhere('PRICE.endtime', null)
        .first();
};

/**
 * Finds a product by its id.
 *
 * @param {*} id id of the product
 * @returns product and price information if found, null otherwise
 */
module.exports.findById = async (id) => {
    return knex('RVITEM')
        .leftJoin('PRICE', function() {
            this.on('PRICE.itemid', '=', 'RVITEM.itemid').andOnNull('PRICE.endtime');
        })
        .where('RVITEM.itemid', id)
        .first();
};

/**
 * Changes a product's stock and price information. If the product's
 * price changes, a new price will be created and old price will be
 * invalidated. Actions are recorded in product history.
 *
 * @param {*} id product id
 * @param {*} buyprice buy price
 * @param {*} sellprice sell price
 * @param {*} quantity quantity
 * @param {*} userid id of the user doing the change
 */
module.exports.changeProductStock = async (productid, buyprice, sellprice, quantity, userid) => {
    return knex.transaction(function(trx) {
        let oldPrice;

        knex.select('*')
            .transacting(trx)
            .from('PRICE')
            .where('PRICE.itemid', productid)
            .andWhere('PRICE.endtime', null)
            .then((rows) => {
                oldPrice = rows[0];

                // update current valid price if only quantity changes
                if (oldPrice.buyprice == buyprice && oldPrice.sellprice == sellprice) {
                    return knex('PRICE')
                        .transacting(trx)
                        .update('count', quantity)
                        .where('priceid', oldPrice.priceid)
                        .then(() => {
                            const newPriceId = oldPrice.priceid;
                            oldPrice.priceid = null;

                            return [newPriceId];
                        });
                }

                // otherwise invalidate old price and create a new price
                return knex('PRICE')
                    .transacting(trx)
                    .update({
                        endtime: new Date(),
                        count: 0
                    })
                    .where('itemid', productid)
                    .andWhere('endtime', null)
                    .then(() => {
                        return knex('PRICE')
                            .transacting(trx)
                            .insert(
                                {
                                    itemid: productid,
                                    barcode: oldPrice.barcode,
                                    count: quantity,
                                    buyprice,
                                    sellprice,
                                    userid,
                                    starttime: new Date()
                                },
                                'priceid'
                            );
                    });
            })
            .then((id) => {
                // record changes in product history
                const newPriceId = id[0];
                const actions = [];
                const timestamp = new Date();

                if (buyprice !== oldPrice.buyprice) {
                    actions.push({
                        time: timestamp,
                        count: quantity,
                        itemid: productid,
                        userid: userid,
                        actionid: 6,
                        priceid1: newPriceId,
                        priceid2: oldPrice.priceid
                    });
                }

                if (sellprice !== oldPrice.sellprice) {
                    actions.push({
                        time: timestamp,
                        count: quantity,
                        itemid: productid,
                        userid: userid,
                        actionid: 7,
                        priceid1: newPriceId,
                        priceid2: oldPrice.priceid
                    });
                }

                if (quantity !== oldPrice.count) {
                    actions.push({
                        time: timestamp,
                        count: quantity,
                        itemid: productid,
                        userid: userid,
                        actionid: 8,
                        priceid1: newPriceId,
                        priceid2: oldPrice.priceid
                    });
                }

                if (actions.length > 0) {
                    return knex('ITEMHISTORY')
                        .transacting(trx)
                        .insert(actions);
                }

                return trx;
            })
            .then(trx.commit)
            .catch(trx.rollback);
    });
};

/**
 * Records a product purchase in the database.
 *
 * @param {integer} productid id of the product that is purchased
 * @param {integer} priceid price id of the product
 * @param {integer} userid id of the user who is purchasing this product
 * @param {integer} quantity product quantity in stock after purchase
 */
module.exports.addPurchase = (productid, priceid, userid, quantity) => {
    return knex.transaction(function(trx) {
        return knex('PRICE')
            .transacting(trx)
            .where('priceid', priceid)
            .update('count', quantity)
            .then(() => {
                return knex
                    .transacting(trx)
                    .insert({
                        time: new Date(),
                        count: quantity,
                        itemid: productid,
                        userid: userid,
                        actionid: 5,
                        priceid1: priceid
                    })
                    .into('ITEMHISTORY');
            });
    });
};

/**
 * Returns all products and their stock quantities, if available.
 *
 */
module.exports.findAll = () => {
    return knex('RVITEM')
        .leftJoin('PRICE', 'RVITEM.itemid', 'PRICE.itemid')
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
};

/**
 * Creates a new product if given barcode is not in use.
 *
 */
module.exports.addProduct = (product, price, userid) => {
    return knex.transaction(function(trx) {
        return knex('RVITEM')
            .transacting(trx)
            .max('itemid as highestid')
            .then((rows) => {
                product.itemid = rows[0].highestid + 1;
                price.itemid = product.itemid;
                return knex('RVITEM')
                    .transacting(trx)
                    .insert(product);
            })
            .then(() => {
                return knex('PRICE')
                    .transacting(trx)
                    .insert(price, 'priceid');
            })
            .then((priceid) => {
                return knex('ITEMHISTORY')
                    .transacting(trx)
                    .insert({
                        time: price.starttime,
                        count: price.count,
                        itemid: price.itemid,
                        userid: userid,
                        actionid: 1,
                        priceid1: priceid[0]
                    });
            })
            .then(() => product.itemid);
    });
};

/**
 * Updates a product's information (name, category, weight)
 *
 * @param {Object} product product to update
 * @param {integer} id product id
 * @param {string} name product name
 * @param {integer} group product category id
 * @param {weight} weight product weight
 * @param {integer} userid id of the user updating the product
 */
module.exports.updateProduct = async ({ id, name, group, weight, userid }) => {
    const oldProduct = await module.exports.findById(id);

    return knex.transaction(function(trx) {
        return knex('RVITEM')
            .transacting(trx)
            .update({
                descr: name,
                pgrpid: group,
                weight
            })
            .where('itemid', id)
            .then(() => {
                // record changes in product history
                const actions = [];
                const action = {
                    time: new Date(),
                    count: oldProduct.count,
                    itemid: id,
                    userid,
                    priceid1: oldProduct.priceid
                };

                if (name !== oldProduct.descr) {
                    actions.push(Object.assign({}, action, { actionid: 2 }));
                }

                if (group !== oldProduct.pgrpid) {
                    actions.push(Object.assign({}, action, { actionid: 4 }));
                }

                if (weight !== oldProduct.weight) {
                    actions.push(Object.assign({}, action, { actionid: 3 }));
                }

                if (actions.length > 0) {
                    return knex('ITEMHISTORY')
                        .transacting(trx)
                        .insert(actions);
                }

                return trx;
            });
    });
};
