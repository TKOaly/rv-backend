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
            .orderBy([
                { column: 'ITEMHISTORY.time', order: 'desc' },
                { column: 'ITEMHISTORY.itemhistid', order: 'desc' }
            ])
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

module.exports.getUserDepositHistory = async (userId) => {
    return (
        knex('PERSONHIST')
            .leftJoin('SALDOHISTORY', 'PERSONHIST.saldhistid', 'SALDOHISTORY.saldhistid')
            .select('PERSONHIST.pershistid', 'PERSONHIST.time', 'SALDOHISTORY.difference', 'SALDOHISTORY.saldo')
            .where('PERSONHIST.userid1', userId)
            /* actionid 17 = deposit action */
            .andWhere('PERSONHIST.actionid', 17)
            .orderBy([{ column: 'PERSONHIST.time', order: 'desc' }, { column: 'PERSONHIST.pershistid', order: 'desc' }])
    );
};

module.exports.findUserDepositById = async (userId, depositId) => {
    return (
        knex('PERSONHIST')
            .leftJoin('SALDOHISTORY', 'PERSONHIST.saldhistid', 'SALDOHISTORY.saldhistid')
            .select('PERSONHIST.pershistid', 'PERSONHIST.time', 'SALDOHISTORY.difference', 'SALDOHISTORY.saldo')
            .where('PERSONHIST.userid1', userId)
            .andWhere('PERSONHIST.pershistid', depositId)
            /* actionid 17 = deposit action */
            .andWhere('PERSONHIST.actionid', 17)
            .first()
    );
};
