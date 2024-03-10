const express = require('express');
const router = express.Router();
const userStore = require('../db/userStore');
const logger = require('./../logger');

// Register a new user
router.post(
	'/',
	async (req, res) => {
		const username = req.body.username;
		const password = req.body.password;
		const fullName = req.body.fullName;
		const email = req.body.email;

		// Check if user, email exists
		const userByUsername = await userStore.findByUsername(username);
		if (userByUsername) {
			logger.error(
				'Failed to register new user, username %s was already taken',
				username,
			);
			res.status(409).json({
				error_code: 'identifier_taken',
				message: 'Username already in use.',
			});
			return;
		}
		const userByEmail = await userStore.findByEmail(email);
		if (userByEmail) {
			logger.error(
				'Failed to register new user, email %s was already taken',
				email,
			);
			res.status(409).json({
				error_code: 'identifier_taken',
				message: 'Email address already in use.',
			});
			return;
		}

		// Add user to db
		const newUser = await userStore.insertUser({
			username,
			password,
			fullName,
			email,
		});

		logger.info(
			'Registered new user: %s',
			username,
		);
		res.status(201).json({
			user: {
				userId: newUser.userId,
				username: newUser.username,
				fullName: newUser.fullName,
				email: newUser.email,
				moneyBalance: newUser.moneyBalance,
				role: newUser.role,
			},
		});
	},
);

module.exports = router;
