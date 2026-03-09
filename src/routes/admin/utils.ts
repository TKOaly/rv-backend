import express from 'express';
import { findByUsername, findByEmail, findByFullName } from '../../db/userStore.js';
import type * as userStore from '../../db/userStore.js';
import logger from '../../logger.js';
import authMiddleware, { type Authenticated_request } from '../authMiddleware.js';

const router = express.Router();

router.use(authMiddleware({ requiredRole: 'ADMIN', tokenSecret: process.env.JWT_SECRET }));

interface Utils_request extends Authenticated_request {
	routeUser?: userStore.user;
}

router.get('/getUserByUsername/:username', async (req: Utils_request, res) => {
	const user = await findByUsername(req.params.username);
	logger.info('User %s fetched user with username %s as admin', req.user.username, req.params.username);
	if (user == undefined) {
		res.status(404).send();
		return;
	}
	res.status(200).json({ user: user });
});

router.get('/getUserByEmail/:email', async (req: Utils_request, res) => {
	const user = await findByEmail(req.params.email);
	logger.info('User %s fetched user with email %s as admin', req.user.username, req.params.email);
	if (user == undefined) {
		res.status(404).send();
		return;
	}
	res.status(200).json({ user: user });
});

router.get('/getUserByFullName/:fullname', async (req: Utils_request, res) => {
	const user = await findByFullName(req.params.fullname);
	logger.info('User %s fetched user with full name %s as admin', req.user.username, req.params.fullname);
	if (user == undefined) {
		res.status(404).send();
		return;
	}
	res.status(200).json({ user: user });
});

export default router;
