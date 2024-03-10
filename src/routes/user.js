const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore');
const authMiddleware = require('./authMiddleware');
const logger = require('../logger');
const deleteUndefinedFields =
    require('../utils/objectUtils').deleteUndefinedFields;

router.post(
	'/user_exists',
	async (req, res) => {
		const username = req.body.username;
		const user = await userStore.findByUsername(username);
		if (user) {
			res.status(200).json({ exists: true });
		} else {
			res.status(200).json({ exists: false });
		}
	},
);

router.use(authMiddleware());

router.get(
	'/',
	async (req, res) => {
		const user = req.user;

		logger.info(
			'User %s fetched user data',
			user.username,
		);
		res.status(200).json({
			user: {
				userId: user.userId,
				username: user.username,
				fullName: user.fullName,
				email: user.email,
				moneyBalance: user.moneyBalance,
				role: user.role,
			},
		});
	},
);

router.patch(
	'/',
	async (req, res) => {
		const user = req.user;

		const username = req.body.username;
		const fullName = req.body.fullName;
		const email = req.body.email;

		// Check if user, email exists
		if (username !== undefined) {
			const userByUsername = await userStore.findByUsername(username);
			if (userByUsername) {
				logger.error(
					'User %s tried to change username to %s but it was taken',
					user.username,
					username,
				);
				res.status(409).json({
					error_code: 'identifier_taken',
					message: 'Username already in use.',
				});
				return;
			}
		}
		if (email !== undefined) {
			const userByEmail = await userStore.findByEmail(email);
			if (userByEmail) {
				logger.error(
					'User %s tried to change email from %s to %s but it was taken',
					user.username,
					user.email,
					email,
				);
				res.status(409).json({
					error_code: 'identifier_taken',
					message: 'Email address already in use.',
				});
				return;
			}
		}

		const updatedUser = await userStore.updateUser(
			user.userId,
			deleteUndefinedFields({
				username: username,
				fullName: fullName,
				email: email,
			}),
		);

		logger.info(
			'User %s changed user data from {%s, %s, %s} to {%s, %s, %s}',
			user.username,
			user.username,
			user.fullName,
			user.email,
			updatedUser.username,
			updatedUser.fullName,
			updatedUser.email,
		);

		res.status(200).json({
			user: {
				userId: updatedUser.userId,
				username: updatedUser.username,
				fullName: updatedUser.fullName,
				email: updatedUser.email,
				moneyBalance: updatedUser.moneyBalance,
				role: updatedUser.role,
			},
		});
	},
);

router.post(
	'/deposit',
	async (req, res) => {
		const user = req.user;
		const amount = req.body.amount;

		const deposit = await userStore.recordDeposit(
			user.userId,
			amount,
		);

		logger.info(
			'User %s deposited %s cents',
			user.username,
			amount,
		);
		res.status(200).json({
			accountBalance: deposit.balanceAfter,
			deposit: {
				depositId: deposit.depositId,
				time: deposit.time,
				amount: deposit.amount,
				balanceAfter: deposit.balanceAfter,
			},
		});
	},
);

router.post(
	'/changeRfid',
	async (req, res) => {
		const user = req.user;
		const rfid = req.body.rfid;

		await userStore.updateUser(
			user.userId,
			{ rfid: rfid },
		);

		logger.info(
			'User %s changed rfid',
			user.username,
		);
		res.status(204).end();
	},
);

router.post(
	'/changePassword',
	async (req, res) => {
		const user = req.user;
		const password = req.body.password;

		await userStore.updateUser(
			user.userId,
			{ password: password },
		);

		logger.info(
			'User %s changed password',
			user.username,
		);
		res.status(204).end();
	},
);

module.exports = router;
