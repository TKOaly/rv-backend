import { createHash } from 'crypto';
import bcrypt from 'bcrypt';
import { deleteUndefinedFields } from '../utils/objectUtils.js';
import actions from './actions.js';
import knex from './knex.js';
import logger from '../logger.js';
import { getRole, getRoleId } from './roles.js';

export const RFID_SALT = 'rv-vakio-suola';
export const NEW_RFID_SALT = 'TamaOnUusiRvVakioSuola';

export interface user {
	userId: any;
	username: any;
	fullName: any;
	email: any;
	moneyBalance: any;
	role: any;
	passwordHash: any;
	rfidHash: any;
	privacyLevel: number; // 0 = no limits, 1 = hide username from public, 2 = hide all data from public
}

export const rowToUser = (row): user | undefined => {
	if (row !== undefined) {
		return {
			userId: row.userid,
			username: row.name,
			fullName: row.realname,
			email: row.univident,
			moneyBalance: row.saldo,
			role: getRole(row.roleid),
			passwordHash: row.pass,
			rfidHash: row.rfid,
			privacyLevel: row.privacy_level,
		};
	} else {
		return undefined;
	}
};

const user_select_query = [
	'RVPERSON.userid',
	'RVPERSON.name',
	'RVPERSON.realname',
	'RVPERSON.univident',
	'RVPERSON.saldo',
	'RVPERSON.roleid',
	'RVPERSON.pass',
	'RVPERSON.rfid',
	'RVPERSON.privacy_level',
];

export const getUsers = async () => {
	const data = await knex('RVPERSON').select(user_select_query);
	return data.map(rowToUser);
};

export const findById = async (userId) => {
	const row = await knex('RVPERSON')
		.select(user_select_query)
		.where('RVPERSON.userid', userId)
		.first();
	return rowToUser(row);
};

export const findByRfid = async (rfid) => {
	const row = await knex('RVPERSON')
		.select(user_select_query)
		.where('RVPERSON.rfid', newRvRfidHash(rfid))
		.first();

	if (row === undefined) {
		return migrateRvRfidHash(rfid);
	}

	return rowToUser(row);
};

export const findByUsername = async (username) => {
	const row = await knex('RVPERSON')
		.select(user_select_query)
		.where('RVPERSON.name', username)
		.first();
	return rowToUser(row);
};

export const findByEmail = async (email) => {
	const row = await knex('RVPERSON')
		.select(user_select_query)
		.where('RVPERSON.univident', email)
		.first();
	return rowToUser(row);
};

export const insertUser = async (userData) => {
	const passwordHash = bcrypt.hashSync(userData.password, 11);
	return await knex.transaction(async (trx) => {
		const now = new Date();
		const insertedPersonRows = await knex('RVPERSON')
			.insert({
				createdate: now,
				// roleid 2 = USER
				roleid: 2,
				name: userData.username,
				univident: userData.email,
				pass: passwordHash,
				saldo: 0,
				realname: userData.fullName,
			})
			.returning(['userid']);
		await knex('PERSONHIST').transacting(trx).insert({
			time: now,
			actionid: actions.USER_CREATED,
			userid1: insertedPersonRows[0].userid,
			userid2: insertedPersonRows[0].userid,
		});
		return {
			userId: insertedPersonRows[0].userid,
			username: userData.username,
			fullName: userData.fullName,
			email: userData.email,
			moneyBalance: 0,
			role: 'USER',
			passwordHash: passwordHash,
			privacyLevel: 0,
		};
	});
};

// This is for compatibility with old RV
export const oldRvRfidHash = (rfid_hex: string): string => {
	const hash = createHash('sha256');
	hash.update(RFID_SALT);
	hash.update(Buffer.from(rfid_hex, 'hex'));
	return hash
		.digest('hex')
		.split('')
		.filter((c, idx) => !(idx % 2 == 0 && c == '0'))
		.join('');
};

export const newRvRfidHash = (rfid_hex: string): string => {
	return bcrypt.hashSync(rfid_hex, `$2b$11$${NEW_RFID_SALT}`);
}

export const migrateRvRfidHash = async (rfid: string) => {
	const row = await knex('RVPERSON')
		.select(user_select_query)
		.where('RVPERSON.rfid', oldRvRfidHash(rfid))
		.first();

	if (row === undefined) {
		return undefined
	}

	const user = updateUser(row.userid, {rfid: rfid});
	logger.info('Migrated user: $1 rfid has to use bcrypt', (await user).username);
	return user;
}

export const updateUser = async (userId, userData) => {
	return await knex.transaction(async (trx) => {
		const rvpersonFields = deleteUndefinedFields({
			name: userData.username,
			realname: userData.fullName,
			univident: userData.email,
			saldo: userData.moneyBalance,
			privacy_level: userData.privacyLevel,
		});
		if (userData.password !== undefined) {
			rvpersonFields.pass = bcrypt.hashSync(userData.password, 11);
		}
		if (userData.rfid !== undefined) {
			rvpersonFields.rfid = newRvRfidHash(userData.rfid);
		}
		if (userData.role !== undefined) {
			rvpersonFields.roleid = getRoleId(userData.role);
		}
		await knex('RVPERSON').transacting(trx).update(rvpersonFields).where({ userid: userId });

		const userRow = await knex('RVPERSON')
			.transacting(trx)
			.select(user_select_query)
			.where('RVPERSON.userid', userId)
			.first();
		return rowToUser(userRow);
	});
};

export const createTempPassword = async (userId, userName) => {
	const now = new Date();
	const hash = bcrypt.hashSync(`${userName}${now.getMilliseconds()}${userId}`, 11);
	const tempPassword = hash.split('$').at(-1).slice(22, 32);
	const hashedTempPassword = bcrypt.hashSync(tempPassword, 11);

	await knex.transaction(async (trx) => {
		await knex('TEMPPASSWORD')
			.transacting(trx)
			.insert({
				userId: userId,
				tempPass: hashedTempPassword,
				time: now
			});
	});

	return tempPassword
};

export const verifyPassword = async (password, passwordHash) => {
	return await bcrypt.compare(password, passwordHash);
};

export const verifyRfid = async (rfid, rfidHash) => {
	return await bcrypt.compare(rfid, rfidHash);
};

export const leaderboard = async () => {
	const result = await knex.raw('SELECT name, saldo FROM "RVPERSON" WHERE privacy_level=0 ORDER BY saldo DESC limit 50;');
	return result.rows;
};

export const recordDeposit = async (userId, amount, type) => {
	if (type != 'cash' && type != 'banktransfer') {
		throw new Error(`Unknown deposit type: ${type}`);
	}
	return await knex.transaction(async (trx) => {
		const now = new Date();

		const updatedPersonRows = await knex('RVPERSON')
			.transacting(trx)
			.where({ userid: userId })
			.increment({ saldo: amount })
			.returning(['saldo']);

		const insertedSaldhistRows = await knex('SALDOHISTORY')
			.transacting(trx)
			.insert({
				userid: userId,
				time: now,
				saldo: updatedPersonRows[0].saldo,
				difference: amount,
			})
			.returning(['saldhistid']);
		const insertedPershistRows = await knex('PERSONHIST')
			.transacting(trx)
			.insert({
				time: now,
				actionid: type == 'cash' ? actions.DEPOSITED_MONEY_CASH : actions.DEPOSITED_MONEY_BANKTRANSFER,
				userid1: userId,
				userid2: userId,
				saldhistid: insertedSaldhistRows[0].saldhistid,
			})
			.returning(['pershistid']);

		return {
			depositId: insertedPershistRows[0].pershistid,
			time: now.toISOString(),
			amount: amount,
			balanceAfter: updatedPersonRows[0].saldo,
		};
	});
};
