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