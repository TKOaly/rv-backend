const express = require('express');
const router = express.Router();
const historyStore = require('../db/historyStore');
const authMiddleware = require('./authMiddleware');
const logger = require('../logger');

router.use(authMiddleware());

router.get('/', async (req, res) => {
    const user = req.rvuser;

    try {
        const deposits = await historyStore.getUserDepositHistory(user.userid);
        const mappedDeposits = deposits.map((deposit) => {
            return {
                depositId: deposit.pershistid,
                time: new Date(deposit.time).toISOString(),
                amount: deposit.difference,
                balanceAfter: deposit.saldo
            };
        });

        logger.info('User %s fetched deposit history', user.name);
        res.status(200).json({
            deposits: mappedDeposits
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/:depositId(\\d+)', async (req, res) => {
    const user = req.rvuser;
    const depositId = req.params.depositId;

    try {
        const deposit = await historyStore.findUserDepositById(user.userid, depositId);

        if (!deposit) {
            logger.error('User %s tried to fetch unknown deposit %s', user.name, depositId);
            res.status(404).json({
                error_code: 'deposit_not_found',
                message: 'Deposit event does not exist'
            });
            return;
        }

        logger.info('User %s fetched deposit %s', user.name, depositId);
        res.status(200).json({
            deposit: {
                depositId: deposit.pershistid,
                time: new Date(deposit.time).toISOString(),
                amount: deposit.difference,
                balanceAfter: deposit.saldo
            }
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

module.exports = router;
