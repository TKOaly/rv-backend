const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const userStore = require('../../db/userStore');
const historyStore = require('../../db/historyStore');
const logger = require('../../logger');
const fieldValidator = require('../../utils/fieldValidator');
const validators = require('../../utils/validators');
const purchaseHistory = require('./purchase_history');

router.use(authMiddleware('ADMIN', process.env.JWT_ADMIN_SECRET));

router.get('/', async (req, res) => {
    const callingUser = req.user;

    try {
        const users = await userStore.getUsers();
        const mappedUsers = users.map((user) => {
            return {
                userId: user.userId,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                moneyBalance: user.moneyBalance,
                role: user.role
            };
        });

        logger.info('User %s fetched all users as admin', callingUser.username);
        res.status(200).json({
            users: mappedUsers
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.get('/:userId(\\d+)', async (req, res) => {
    const callingUser = req.user;
    const userId = parseInt(req.params.userId);

    try {
        const user = await userStore.findById(userId);

        if (!user) {
            logger.error('User %s tried to fetch unknown user %s as admin', callingUser.username, userId);
            res.status(404).json({
                error_code: 'not_found',
                message: 'User does not exist'
            });
            return;
        }

        logger.info('User %s fetched user %s as admin', callingUser.username, userId);
        res.status(200).json({
            user: {
                userId: user.userId,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                moneyBalance: user.moneyBalance,
                role: user.role
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

router.post('/:userId(\\d+)/changeRole', async (req, res) => {
    const callingUser = req.user;

    const inputValidators = [validators.nonEmptyString('role')];

    const errors = fieldValidator.validateObject(req.body, inputValidators);
    if (errors.length > 0) {
        logger.error(
            '%s %s: invalid request by user %s: %s',
            req.method,
            req.originalUrl,
            callingUser.username,
            errors.join(', ')
        );
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Missing or invalid fields in request',
            errors
        });
        return;
    }

    const userId = parseInt(req.params.userId);
    const role = req.body.role;

    try {
        const user = await userStore.findById(userId);
        if (!user) {
            logger.error('User %s tried to change role of unknown user %s', callingUser.username, userId);
            res.status(404).json({
                error_code: 'not_found',
                message: 'User does not exist'
            });
            return;
        }

        if (!['USER1', 'ADMIN'].includes(role)) {
            logger.error(
                'User %s tried to change role of user %s to unknown role %s',
                callingUser.username,
                userId,
                role
            );
            res.status(400).json({
                error_code: 'invalid_reference',
                message: 'Referenced role not found'
            });
            return;
        }

        const updatedUser = await userStore.updateUser(userId, { role });

        logger.info('User %s changed role of user %s to role %s', callingUser.username, userId, role);
        res.status(200).json({
            role: updatedUser.role
        });
    } catch (error) {
        logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
        res.status(500).json({
            error_code: 'internal_error',
            message: 'Internal error'
        });
    }
});

router.use('/:userId(\\d+)/purchaseHistory', (req, res) => {
    const userId = req.params.userId;
    const filter = (builder) => builder.where('RVPERSON.userid', userId);

    return purchaseHistory(filter)(req, res);
});

router.get('/:userId(\\d+)/depositHistory', async (req, res) => {
    const user = await userStore.findById(req.params.userId);

    if (user === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `No user with id '${req.params.userId}' found`
        });

        return;
    }

    const history = await historyStore.getUserDepositHistory(req.params.userId);

    res.status(200).json({
        deposits: history
    });
});

router.get('/:userId(\\d+)/depositHistory/:depositId', async (req, res) => {
    const deposit = await historyStore.findDepositById(req.params.depositId);

    if (deposit === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `No deposit with id '${req.params.depositId}' found`
        });

        return;
    }

    res.status(200).json({
        deposit
    });
});

module.exports = router;
