import * as userStore from '../db/userStore.js';
import jwt from '../jwt/token.js';
import logger from './../logger.js';

/* null means no role requirements. */
export const verifyRole = (requiredRole, userRole) => {
	return userRole !== 'INACTIVE' && (requiredRole === null || requiredRole === userRole);
};

export const authenticateUserRfid =
	(requiredRole = null, tokenSecret = process.env.JWT_SECRET) =>
	async (req, res) => {
		const body = req.body;
		const rfid = body.rfid;
		let loggedInFromRvTerminal = false;
		if (body.rvTerminalSecret === process.env.RV_TERMINAL_SECRET) {
			loggedInFromRvTerminal = true;
		} else {
			logger.warn('Rfid login failed, rv_terminal_secret not included');
			res.status(401).json({
				error_code: 'invalid_credentials',
				message: 'Invalid rfid',
			});
			return;
		}

		const user = await userStore.findByRfid(rfid);
		if (user) {
			if (verifyRole(requiredRole, user.role)) {
				logger.info('User %s logged in as role %s', user.username, requiredRole);
				userStore.removeTempPassword(user.userId);
				res.status(200).json({
					accessToken: jwt.sign({ userId: user.userId, loggedInFromRvTerminal }, tokenSecret),
					loginWithTempPassword: false
				});
			} else {
				logger.warn('User %s is not authorized to login as role %s', user.username, requiredRole);
				res.status(403).json({
					error_code: 'not_authorized',
					message: 'Not authorized',
				});
			}
		} else {
			logger.warn('Failed to login with rfid');
			res.status(401).json({
				error_code: 'invalid_credentials',
				message: 'Invalid rfid',
			});
		}
	};

export const authenticateUser =
	(requiredRole = null) =>
	async (req, res) => {
		const body = req.body;
		const username = body.username;
		const password = body.password;
		let loggedInFromRvTerminal = false;
		if (body.rvTerminalSecret === process.env.RV_TERMINAL_SECRET) {
			loggedInFromRvTerminal = true;
		}
		const user = await userStore.findByUsername(username);
		if (user) {
			if (password != undefined) {
				 if (await userStore.verifyPassword(password, user.passwordHash)) {
					if (loggedInFromRvTerminal && user.tempPasswordHash && (await userStore.verifyPassword(password, user.tempPasswordHash))) {
						logger.info('User %s logged in with temporary password and role %s', user.username, user.role);
						res.status(200).json({
							accessToken: jwt.sign({ userId: user.userId, loggedInFromRvTerminal }, process.env.JWT_SECRET),
							loginWithTempPassword: true
						});
					}
					if (verifyRole(requiredRole, user.role)) {
						logger.info('User %s logged in with role %s', user.username, user.role);
						userStore.removeTempPassword(user.userId);
						res.status(200).json({
							accessToken: jwt.sign({ userId: user.userId, loggedInFromRvTerminal }, process.env.JWT_SECRET),
							loginWithTempPassword: false
						});
					} else {
						logger.warn('User %s is not authorized to login as role %s', user.username, requiredRole);
						res.status(403).json({
							error_code: 'not_authorized',
							message: 'Not authorized',
						});
					}
				 } else {
					logger.warn('Failed to login with username and password. Username was %s', username);
					res.status(401).json({
						error_code: 'invalid_credentials',
						message: 'Invalid username or password',
					});
				}
			} else {
				logger.warn('Failed to login with username and password. Username was %s', username);
				res.status(401).json({
					error_code: 'invalid_credentials',
					message: 'Invalid username or password',
				});
			}
		} else {
			logger.warn('Failed to login with username and password. Username was %s', username);
			res.status(401).json({
				error_code: 'invalid_credentials',
				message: 'Invalid username or password',
			});
		}
	};
