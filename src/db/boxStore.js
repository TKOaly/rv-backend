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
            'RVBOX.itemcount AS items_per_box',
            'RVITEM.itemid AS product_id'
        )
        .then(rows => {
            return rows.map(r => ({
                box_barcode: r.box_barcode,
                items_per_box: r.items_per_box,
                product_barcode: r.product_barcode,
                product_id: r.product_id
            }));
        });
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
            'RVBOX.itemcount AS items_per_box',
            'RVITEM.itemid AS product_id'
        )
        .then(rows => {
            if (rows.length === 0) {
                return null;
            } else {
                const r = rows[0];
                return {
                    box_barcode: r.box_barcode,
                    items_per_box: r.items_per_box,
                    product_barcode: r.product_barcode,
                    product_id: r.product_id
                };
            }
        });
};
