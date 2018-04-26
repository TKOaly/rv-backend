const knex = require('./knex');

/**
 * Retrieves all boxes and their associated products.
 */
module.exports.findAll = () => {
    return knex('RVBOX')
        .innerJoin('PRICE', function() {
            this.on('PRICE.barcode', '=', 'RVBOX.itembarcode')
                .andOnNull('PRICE.endtime');
        })
        .innerJoin('RVITEM', 'RVITEM.itemid', 'PRICE.itemid')
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
module.exports.findByBoxBarcode = barcode => {
    return knex('RVBOX')
        .innerJoin('PRICE', function() {
            this.on('PRICE.barcode', '=', 'RVBOX.itembarcode')
                .andOnNull('PRICE.endtime');
        })
        .innerJoin('RVITEM', 'RVITEM.itemid', 'PRICE.itemid')
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
