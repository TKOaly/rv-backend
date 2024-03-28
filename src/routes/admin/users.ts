import express from 'express';
import historyStore from '../../db/historyStore.js';
import userStore, { type user } from '../../db/userStore.js';
import logger from '../../logger.js';
import authMiddleware, { type Authenticated_request } from '../authMiddleware.js';

const router = express.Router();

router.use(authMiddleware('ADMIN', process.env.JWT_ADMIN_SECRET));

interface Users_request extends Authenticated_request {
	routeUser: user;
}

router.param('userId', async (req: Users_request, res, next) => {
	const user = await userStore.findById(req.params.userId);

	if (user === undefined) {
		res.status(404).json({
			error_code: 'not_found',
			message: `No user with id '${req.params.userId}' found`,
		});

		logger.error('User %s tried to access unknown user %s as admin', req.user.username, req.params.userId);

		return;
	}

	req.routeUser = user;
	next();
});

router.get('/', async (req: Users_request, res) => {
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
				role: user.role,
			};
		});

		logger.info('User %s fetched all users as admin', callingUser.username);
		res.status(200).json({
			users: mappedUsers,
		});
	} catch (error) {
		logger.error('Error at %s %s: %s', req.method, req.originalUrl, error);
		res.status(500).json({
			error_code: 'internal_error',
			message: 'Internal error',
		});
	}
});

router.get('/:userId(\\d+)', async (req: Users_request, res) => {
	logger.info('User %s fetched user %s as admin', req.user.username, req.routeUser.userId);

	res.status(200).json({
		user: {
			userId: req.routeUser.userId,
			username: req.routeUser.username,
			fullName: req.routeUser.fullName,
			email: req.routeUser.email,
			moneyBalance: req.routeUser.moneyBalance,
			role: req.routeUser.role,
		},
	});
});

router.post('/:userId(\\d+)/changeRole', async (req: Users_request, res) => {
	const role = req.body.role;

	const updatedUser = await userStore.updateUser(req.routeUser.userId, {
		role,
	});

	logger.info('User %s changed role of user %s to role %s', req.user.username, req.routeUser.userId, role);

	res.status(200).json({
		role: updatedUser.role,
	});
});

router.get('/:userId(\\d+)/purchaseHistory', async (req: Users_request, res) => {
	const purchases = await historyStore.getUserPurchaseHistory(req.routeUser.userId);

	res.status(200).json({
		purchases,
	});
});

router.get('/:userId(\\d+)/depositHistory', async (req: Users_request, res) => {
	const history = await historyStore.getUserDepositHistory(req.routeUser.userId);

	res.status(200).json({
		deposits: history,
	});
});

export default router;
