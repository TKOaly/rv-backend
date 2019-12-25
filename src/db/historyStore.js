const knex = require('./knex');

const rowToPurchase = (row) => {
    return {
        purchaseId: row.itemhistid,
        time: new Date(row.time).toISOString(),
        price: row.sellprice
    };
};
const rowToDeposit = (row) => {
    return {
        depositId: row.pershistid,
        time: new Date(row.time).toISOString(),
        amount: row.difference
    };
};
const rowToProduct = (row) => {
    return {
        barcode: row.barcode,
        productId: row.itemid,
        name: row.descr,
        category: {
            categoryId: row.pgrpid,
            description: row.pgrpdescr
        },
        weight: row.weight
    };
};
const rowToUser = (row) => {
    return {
        userId: row.userid,
        username: row.name,
        fullName: row.realname,
        email: row.univident,
        role: row.role
    };
};

module.exports.getUserPurchaseHistory = async (userId) => {
    const data = await knex('ITEMHISTORY')
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
        ]);

    return data.map((row) => {
        return {
            ...rowToPurchase(row),
            product: rowToProduct(row),
            balanceAfter: row.saldo
        };
    });
};

module.exports.findUserPurchaseById = async (userId, purchaseId) => {
    const row = await knex('ITEMHISTORY')
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
        .first();

    if (row !== undefined) {
        return {
            ...rowToPurchase(row),
            product: rowToProduct(row),
            balanceAfter: row.saldo
        };
    } else {
        return undefined;
    }
};

module.exports.getUserDepositHistory = async (userId) => {
    const data = await knex('PERSONHIST')
        .leftJoin('SALDOHISTORY', 'PERSONHIST.saldhistid', 'SALDOHISTORY.saldhistid')
        .select('PERSONHIST.pershistid', 'PERSONHIST.time', 'SALDOHISTORY.difference', 'SALDOHISTORY.saldo')
        .where('PERSONHIST.userid1', userId)
        /* actionid 17 = deposit action */
        .andWhere('PERSONHIST.actionid', 17)
        .orderBy([
            { column: 'PERSONHIST.time', order: 'desc' },
            { column: 'PERSONHIST.pershistid', order: 'desc' }
        ]);

    return data.map((row) => {
        return {
            ...rowToDeposit(row),
            balanceAfter: row.saldo
        };
    });
};

module.exports.findUserDepositById = async (userId, depositId) => {
    const row = await knex('PERSONHIST')
        .leftJoin('SALDOHISTORY', 'PERSONHIST.saldhistid', 'SALDOHISTORY.saldhistid')
        .select('PERSONHIST.pershistid', 'PERSONHIST.time', 'SALDOHISTORY.difference', 'SALDOHISTORY.saldo')
        .where('PERSONHIST.userid1', userId)
        .andWhere('PERSONHIST.pershistid', depositId)
        /* actionid 17 = deposit action */
        .andWhere('PERSONHIST.actionid', 17)
        .first();

    if (row !== undefined) {
        return {
            ...rowToDeposit(row),
            balanceAfter: row.saldo
        };
    } else {
        return undefined;
    }
};
