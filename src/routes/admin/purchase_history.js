const express = require('express');
const knex = require('../../db/knex');

const mapRowToPurchase = (row) => ({
    purchaseId: row.itemhistid,
    time: row.time,
    price: row.sellprice,
    stockAfter: row.count,
    user: {
        userId: row.userid,
        username: row.name,
        fullName: row.realname,
        role: row.role,
        email: row.univident
    }
});

module.exports = (subquery) => {
    const router = express.Router();

    if (!subquery) {
        subquery = () => {};
    }

    router.get('/', async (req, res) => {
        const rows = await knex('ITEMHISTORY')
            .leftJoin('PRICE', 'PRICE.priceid', 'ITEMHISTORY.priceid1')
            .leftJoin('RVPERSON', 'RVPERSON.userid', 'ITEMHISTORY.userid')
            .leftJoin('ROLE', 'ROLE.roleid', 'RVPERSON.roleid')
            .where({ 'ITEMHISTORY.actionid': 5 })
            .andWhere((builder) => subquery(builder, req))
            .select(
                'ITEMHISTORY.itemhistid',
                'ITEMHISTORY.time',
                'ITEMHISTORY.count',
                'PRICE.sellprice',
                'RVPERSON.userid',
                'RVPERSON.realname',
                'RVPERSON.name',
                'RVPERSON.univident',
                'ROLE.role'
            );

        const purchases = rows.map(mapRowToPurchase);

        res.status(200).json({
            purchases
        });
    });

    router.get('/:purchaseId', async (req, res) => {
        const row = await knex('ITEMHISTORY')
            .leftJoin('PRICE', 'PRICE.priceid', 'ITEMHISTORY.priceid1')
            .leftJoin('RVPERSON', 'RVPERSON.userid', 'ITEMHISTORY.userid')
            .leftJoin('ROLE', 'ROLE.roleid', 'RVPERSON.roleid')
            .where({
                'ITEMHISTORY.actionid': 5,
                'ITEMHISTORY.itemhistid': req.params.purchaseId
            })
            .andWhere((builder) => subquery(builder, req))
            .first(
                'ITEMHISTORY.itemhistid',
                'ITEMHISTORY.time',
                'ITEMHISTORY.count',
                'PRICE.sellprice',
                'RVPERSON.userid',
                'RVPERSON.realname',
                'RVPERSON.univident',
                'RVPERSON.name',
                'ROLE.role'
            );

        if (row === undefined) {
            res.status(404).json({
                error_code: 'not_found',
                message: 'No such purchase found'
            });

            return;
        }

        res.status(200).json({
            purchase: mapRowToPurchase(row)
        });
    });

    return router;
};
