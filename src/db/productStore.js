const knex = require('./knex');

/**
 * Finds a product by its barcode.
 * 
 * @param {string} barcode barcode of the product
 * @returns product and price information if found, null otherwise
 */
module.exports.findByBarcode = (barcode) => {
    return knex('PRICE')
        .innerJoin('RVITEM', function() {
            this.on('RVITEM.itemid', '=', 'PRICE.itemid');
        })
        .whereNotNull('starttime')
        .andWhere('endtime', null)
        .andWhere('barcode', barcode)
        .then((rows) => {
            if (rows.length > 0) {
                return rows[0];
            } else {
                return null;
            }
        });
};

/**
 * Finds a product by its id.
 * 
 * @param {*} id id of the product
 * @returns product and price information if found, null otherwise
 */
module.exports.findById = async id => {
    return knex('RVITEM')
        .leftJoin('PRICE', function() {
            this.on('PRICE.itemid', '=', 'RVITEM.itemid')
                .andOnNull('PRICE.endtime');
        })
        .where('RVITEM.itemid', id)
        .then(rows => {
            return rows.length > 0 ? rows[0] : null;
        });
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
module.exports.changeProductStock = async (
    productid,
    buyprice,
    sellprice,
    quantity,
    userid
) => {
    return knex.transaction(function(trx) {
        let oldPrice;

        knex.select('*')
            .transacting(trx)
            .from('PRICE')
            .where('PRICE.itemid', productid)
            .andWhere('PRICE.endtime', null)
            .then(rows => {
                oldPrice = rows[0];

                // update current valid price if only quantity changes
                if (oldPrice.buyprice == buyprice && oldPrice.sellprice == sellprice) {
                    return knex('PRICE')
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
                            .insert({
                                itemid: productid,
                                barcode: oldPrice.barcode,
                                count: quantity,
                                buyprice,
                                sellprice,
                                userid,
                                starttime: new Date()
                            }, 'priceid');
                    });
            })
            .then(id => {
                // record changes in product history
                let newPriceId = id[0];
                let actions = [];
                let timestamp = new Date();

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

                return knex('ITEMHISTORY')
                    .transacting(trx)
                    .insert(actions);
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
        .leftJoin('PRICE', function() {
            this.on('PRICE.itemid', '=', 'RVITEM.itemid')
                .andOnNull('PRICE.endtime');
        })
        .select(
            'RVITEM.itemid',
            'RVITEM.descr',
            'PRICE.barcode',
            'PRICE.buyprice',
            'PRICE.sellprice'
        )
        .sum('PRICE.count as quantity')
        .groupBy('RVITEM.itemid', 'PRICE.barcode', 'PRICE.buyprice', 'PRICE.sellprice');
};

/**
 * Creates a new product if given barcode is not in use.
 * 
 */
module.exports.addProduct = (product, price) => {
    return knex.transaction(trx => {
        return trx
            .insert(product)
            .into('RVITEM')
            .then(() => {
                return trx
                    .insert(price)
                    .into('PRICE')
        })
    })
    .then(() => {
        console.log('Successful DB-transaction')
        return 'success'
    })
    .catch(err => {
        console.log('Failure in inserting to DB')
        return 'failure'
    })
}
