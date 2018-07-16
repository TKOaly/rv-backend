const knex = require('./knex');
const productStore = require('./productStore');

/**
 * Retrieves all boxes and their associated products.
 */
module.exports.findAll = () => {
    return knex('RVBOX')
        .leftJoin('PRICE', function() {
            this.on('PRICE.barcode', '=', 'RVBOX.itembarcode').andOnNull('PRICE.endtime');
        })
        .leftJoin('RVITEM', 'RVITEM.itemid', 'PRICE.itemid')
        .select(
            'RVBOX.barcode AS box_barcode',
            'RVBOX.itembarcode AS product_barcode',
            'RVITEM.descr AS product_name',
            'RVBOX.itemcount AS items_per_box',
            'RVITEM.itemid AS product_id'
        );
};

/**
 * Finds a box by its barcode.
 *
 * @param {} barcode barcode of the box
 */
module.exports.findByBoxBarcode = (barcode) => {
    return knex('RVBOX')
        .leftJoin('PRICE', function() {
            this.on('PRICE.barcode', '=', 'RVBOX.itembarcode').andOnNull('PRICE.endtime');
        })
        .leftJoin('RVITEM', 'RVITEM.itemid', 'PRICE.itemid')
        .where('RVBOX.barcode', barcode)
        .select(
            'RVBOX.barcode AS box_barcode',
            'RVBOX.itembarcode AS product_barcode',
            'RVITEM.descr AS product_name',
            'RVBOX.itemcount AS items_per_box',
            'RVITEM.itemid AS product_id'
        )
        .first();
};

/**
 * Creates a new box for a product.
 *
 * @param {*} boxBarcode barcode of the box
 * @param {*} productBarcode barcode of the product in the box
 * @param {*} itemsPerBox number of items in the box
 * @param {*} userid user who created the box
 */
module.exports.createBox = async (boxBarcode, productBarcode, itemsPerBox, userid) => {
    const product = await productStore.findByBarcode(productBarcode);
    if (!product) {
        throw new Error('product not found');
    }

    return knex.transaction(function(trx) {
        return knex('RVBOX')
            .transacting(trx)
            .insert({
                barcode: boxBarcode,
                itembarcode: productBarcode,
                itemcount: itemsPerBox
            })
            .then(() => {
                return knex('BOXHISTORY')
                    .transacting(trx)
                    .insert({
                        barcode: boxBarcode,
                        itemid: product.itemid,
                        time: new Date(),
                        itemcount: itemsPerBox,
                        userid: userid,
                        actionid: 24
                    });
            });
    });
};

module.exports.updateBox = async (boxBarcode, productBarcode, itemsPerBox, userid) => {
    const product = await productStore.findByBarcode(productBarcode);
    if (!product) {
        throw new Error('product not found');
    }

    return knex.transaction(function(trx) {
        return knex('RVBOX')
            .transacting(trx)
            .update({
                barcode: boxBarcode,
                itembarcode: productBarcode,
                itemcount: itemsPerBox
            })
            .where('barcode', boxBarcode)
            .then(() => {
                return knex('BOXHISTORY')
                    .transacting(trx)
                    .insert({
                        barcode: boxBarcode,
                        itemid: product.itemid,
                        time: new Date(),
                        itemcount: itemsPerBox,
                        userid: userid,
                        actionid: 25
                    });
            });
    });
};
