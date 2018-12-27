const knex = require('./knex');

module.exports.getUserPurchaseHistory = async (userId) => {
    return (
        knex('ITEMHISTORY')
            .leftJoin('RVITEM', 'ITEMHISTORY.itemid', 'RVITEM.itemid')
            .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
            .leftJoin('PRICE', 'ITEMHISTORY.priceid1', 'PRICE.priceid')
            .leftJoin('SALDOHISTORY', 'ITEMHISTORY.saldhistid', 'SALDOHISTORY.saldhistid')
            .select(
                'ITEMHISTORY.itemhistid',
                'ITEMHISTORY.time',
                'RVITEM.itemid',
                'RVITEM.descr',
                'RVITEM.pgrpid',
                'PRODGROUP.descr as pgrpdescr',
                'RVITEM.weight',
                'PRICE.barcode',
                'PRICE.sellprice',
                'SALDOHISTORY.saldo'
            )
            .where('ITEMHISTORY.userid', userId)
            /* actionid 5 = buy action */
            .andWhere('ITEMHISTORY.actionid', 5)
            .orderBy('ITEMHISTORY.time', 'desc')
    );
};

module.exports.findUserPurchaseById = async (userId, purchaseId) => {
    return (
        knex('ITEMHISTORY')
            .leftJoin('RVITEM', 'ITEMHISTORY.itemid', 'RVITEM.itemid')
            .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
            .leftJoin('PRICE', 'ITEMHISTORY.priceid1', 'PRICE.priceid')
            .leftJoin('SALDOHISTORY', 'ITEMHISTORY.saldhistid', 'SALDOHISTORY.saldhistid')
            .select(
                'ITEMHISTORY.itemhistid',
                'ITEMHISTORY.time',
                'RVITEM.itemid',
                'RVITEM.descr',
                'RVITEM.pgrpid',
                'PRODGROUP.descr as pgrpdescr',
                'RVITEM.weight',
                'PRICE.barcode',
                'PRICE.sellprice',
                'SALDOHISTORY.saldo'
            )
            .where('ITEMHISTORY.itemhistid', purchaseId)
            .andWhere('ITEMHISTORY.userid', userId)
            /* actionid 5 = buy action */
            .andWhere('ITEMHISTORY.actionid', 5)
            .first()
    );
};
