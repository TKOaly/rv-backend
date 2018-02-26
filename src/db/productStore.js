const knex = require('./knex');

/*
SELECT
RVITEM.descr
PRICE.buyprice
FROM
PRICE INNER JOIN RVITEM ON RVITEM.itemid = PRICE.itemid
WHERE PRICE.starttime IS NOT NULL
AND PRICE.endtime IS NULL
AND PRICE.barcode = barcode
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