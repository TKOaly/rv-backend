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

module.exports.getPurchaseHistory = async () => {
    const data = await knex('ITEMHISTORY')
        .leftJoin('RVITEM', 'ITEMHISTORY.itemid', 'RVITEM.itemid')
        .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
        .leftJoin('PRICE', 'ITEMHISTORY.priceid1', 'PRICE.priceid')
        .leftJoin('RVPERSON', 'ITEMHISTORY.userid', 'RVPERSON.userid')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
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
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'ROLE.role'
        )
        /* actionid 5 = buy action */
        .where('ITEMHISTORY.actionid', 5)
        .orderBy([
            { column: 'ITEMHISTORY.time', order: 'desc' },
            { column: 'ITEMHISTORY.itemhistid', order: 'desc' }
        ]);

    return data.map((row) => {
        return {
            ...rowToPurchase(row),
            product: rowToProduct(row),
            user: rowToUser(row)
        };
    });
};

module.exports.findPurchaseById = async (purchaseId) => {
    const row = await knex('ITEMHISTORY')
        .leftJoin('RVITEM', 'ITEMHISTORY.itemid', 'RVITEM.itemid')
        .leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
        .leftJoin('PRICE', 'ITEMHISTORY.priceid1', 'PRICE.priceid')
        .leftJoin('RVPERSON', 'ITEMHISTORY.userid', 'RVPERSON.userid')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
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
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'ROLE.role'
        )
        .where('ITEMHISTORY.itemhistid', purchaseId)
        /* actionid 5 = buy action */
        .andWhere('ITEMHISTORY.actionid', 5)
        .first();

    if (row !== undefined) {
        return {
            ...rowToPurchase(row),
            product: rowToProduct(row),
            user: rowToUser(row)
        };
    } else {
        return undefined;
    }
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

module.exports.getProductPurchaseHistory = async (barcode) => {
    const data = await knex('ITEMHISTORY')
        .leftJoin('PRICE', 'ITEMHISTORY.priceid1', 'PRICE.priceid')
        .leftJoin('RVPERSON', 'ITEMHISTORY.userid', 'RVPERSON.userid')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select(
            'ITEMHISTORY.itemhistid',
            'ITEMHISTORY.time',
            'ITEMHISTORY.count',
            'PRICE.sellprice',
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'ROLE.role'
        )
        .where('PRICE.barcode', barcode)
        /* actionid 5 = buy action */
        .andWhere('ITEMHISTORY.actionid', 5)
        .orderBy([
            { column: 'ITEMHISTORY.time', order: 'desc' },
            { column: 'ITEMHISTORY.itemhistid', order: 'desc' }
        ]);

    return data.map((row) => {
        return {
            ...rowToPurchase(row),
            user: rowToUser(row),
            stockAfter: row.count
        };
    });
};

module.exports.findProductPurchaseById = async (barcode, purchaseId) => {
    const row = await knex('ITEMHISTORY')
        .leftJoin('PRICE', 'ITEMHISTORY.priceid1', 'PRICE.priceid')
        .leftJoin('RVPERSON', 'ITEMHISTORY.userid', 'RVPERSON.userid')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select(
            'ITEMHISTORY.itemhistid',
            'ITEMHISTORY.time',
            'ITEMHISTORY.count',
            'PRICE.sellprice',
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'ROLE.role'
        )
        .where('ITEMHISTORY.itemhistid', purchaseId)
        .andWhere('PRICE.barcode', barcode)
        /* actionid 5 = buy action */
        .andWhere('ITEMHISTORY.actionid', 5)
        .first();

    if (row !== undefined) {
        return {
            ...rowToPurchase(row),
            user: rowToUser(row),
            stockAfter: row.count
        };
    } else {
        return undefined;
    }
};

module.exports.getDepositHistory = async () => {
    const data = await knex('PERSONHIST')
        .leftJoin('SALDOHISTORY', 'PERSONHIST.saldhistid', 'SALDOHISTORY.saldhistid')
        .leftJoin('RVPERSON', 'PERSONHIST.userid1', 'RVPERSON.userid')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select(
            'PERSONHIST.pershistid',
            'PERSONHIST.time',
            'SALDOHISTORY.difference',
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'ROLE.role'
        )
        /* actionid 17 = deposit action */
        .where('PERSONHIST.actionid', 17)
        .orderBy([
            { column: 'PERSONHIST.time', order: 'desc' },
            { column: 'PERSONHIST.pershistid', order: 'desc' }
        ]);

    return data.map((row) => {
        return {
            ...rowToDeposit(row),
            user: rowToUser(row)
        };
    });
};

module.exports.findDepositById = async (depositId) => {
    const row = await knex('PERSONHIST')
        .leftJoin('SALDOHISTORY', 'PERSONHIST.saldhistid', 'SALDOHISTORY.saldhistid')
        .leftJoin('RVPERSON', 'PERSONHIST.userid1', 'RVPERSON.userid')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select(
            'PERSONHIST.pershistid',
            'PERSONHIST.time',
            'SALDOHISTORY.difference',
            'RVPERSON.userid',
            'RVPERSON.name',
            'RVPERSON.realname',
            'RVPERSON.univident',
            'ROLE.role'
        )
        .where('PERSONHIST.pershistid', depositId)
        /* actionid 17 = deposit action */
        .andWhere('PERSONHIST.actionid', 17)
        .first();

    if (row !== undefined) {
        return {
            ...rowToDeposit(row),
            user: rowToUser(row)
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
