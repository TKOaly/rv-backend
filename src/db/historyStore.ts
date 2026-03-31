import actions from './actions.js';
import knex from './knex.js';
import { rowToProduct } from './productStore.js';
import { rowToUser } from './userStore.js';

const rowToPurchase = (row) => {
	return {
		purchaseId: row.itemhistid,
		time: new Date(row.time).toISOString(),
		price: row.sellprice,
		balanceAfter: row.saldo,
		stockAfter: row.count,
		returned: row.returned,
	};
};

const rowToDeposit = (row) => {
	return {
		depositId: row.pershistid,
		time: new Date(row.time).toISOString(),
		amount: row.difference,
		balanceAfter: row.saldo,
		type: row.actionid,
	};
};

export const createPurchaseHistoryQuery = () =>
	knex('ITEMHISTORY')
		.leftJoin('RVITEM', 'ITEMHISTORY.itemid', 'RVITEM.itemid')
		.leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
		.leftJoin('PRICE', 'ITEMHISTORY.priceid1', 'PRICE.priceid')
		.leftJoin('RVPERSON', 'ITEMHISTORY.userid', 'RVPERSON.userid')
		.leftJoin('SALDOHISTORY', 'ITEMHISTORY.saldhistid', 'SALDOHISTORY.saldhistid')
		.leftJoin('ITEMHISTORY as ih2', 'ih2.itemhistid2', 'ITEMHISTORY.itemhistid')
		.select(
			'ITEMHISTORY.itemhistid',
			'ITEMHISTORY.time',
			'ITEMHISTORY.count',
			'RVITEM.descr',
			'RVITEM.pgrpid',
			'PRODGROUP.descr as pgrpdescr',
			'PRICE.barcode',
			'PRICE.sellprice',
			'PRICE.buyprice',
			'PRICE.count as stock',
			'RVPERSON.userid',
			'RVPERSON.name',
			'RVPERSON.realname',
			'RVPERSON.univident',
			'RVPERSON.saldo as currentsaldo',
			'RVPERSON.roleid',
			'SALDOHISTORY.saldo',
			'RVPERSON.privacy_level',
			knex.raw('(ih2.itemhistid2 is not null) as returned')
		)
		.where('ITEMHISTORY.actionid', actions.BOUGHT_BY) /* actionid 5 = buy action */
		.orderBy([
			{ column: 'ITEMHISTORY.time', order: 'desc' },
			{ column: 'ITEMHISTORY.itemhistid', order: 'desc' },
		]);

export const createDepositHistoryQuery = () =>
	knex('PERSONHIST')
		.leftJoin('SALDOHISTORY', 'PERSONHIST.saldhistid', 'SALDOHISTORY.saldhistid')
		.leftJoin('RVPERSON', 'PERSONHIST.userid1', 'RVPERSON.userid')
		.select(
			'PERSONHIST.pershistid',
			'PERSONHIST.time',
			'SALDOHISTORY.difference',
			'SALDOHISTORY.saldo',
			'RVPERSON.userid',
			'RVPERSON.name',
			'RVPERSON.realname',
			'RVPERSON.univident',
			'RVPERSON.saldo as currentsaldo',
			'RVPERSON.roleid',
			'PERSONHIST.actionid',
			'RVPERSON.privacy_level'
		)
		.whereIn('PERSONHIST.actionid', [
			actions.DEPOSITED_MONEY_CASH,
			actions.DEPOSITED_MONEY_BANKTRANSFER,
			actions.DEPOSITED_MONEY,
		])
		.orderBy([
			{ column: 'PERSONHIST.time', order: 'desc' },
			{ column: 'PERSONHIST.pershistid', order: 'desc' },
		]);

export const getPurchaseHistory = async (offset?: number, limit?: number) => {
	let query = createPurchaseHistoryQuery();
	if (offset) query = query.andWhere('ITEMHISTORY.itemhistid', '<', offset);
	if (limit) query = query.limit(limit);
	const data = await query;

	return data.map((row) => {
		return {
			...rowToPurchase(row),
			product: rowToProduct(row),
			user: rowToUser(row),
		};
	});
};

export const getUserPurchaseHistory = async (userId) => {
	const data = await createPurchaseHistoryQuery().andWhere('ITEMHISTORY.userid', userId);

	return data.map((row) => {
		return {
			...rowToPurchase(row),
			product: rowToProduct(row),
		};
	});
};

export const getProductPurchaseHistory = async (barcode) => {
	const data = await createPurchaseHistoryQuery().andWhere('PRICE.barcode', barcode);

	return data.map((row) => {
		return {
			...rowToPurchase(row),
			user: rowToUser(row),
		};
	});
};

export const findPurchaseById = async (purchaseId) => {
	const row = await createPurchaseHistoryQuery().andWhere('ITEMHISTORY.itemhistid', purchaseId).first();

	if (row !== undefined) {
		return {
			...rowToPurchase(row),
			product: rowToProduct(row),
			user: rowToUser(row),
		};
	} else {
		return undefined;
	}
};

export const getDepositHistory = async (offset?: number, limit?: number) => {
	let query = createDepositHistoryQuery();
	if (offset) query = query.andWhere('PERSONHIST.pershistid', '<', offset);
	if (limit) query = query.limit(limit);
	const data = await query;

	return data.map((row) => {
		return {
			...rowToDeposit(row),
			user: rowToUser(row),
		};
	});
};

export const getUserDepositHistory = async (userId) => {
	const data = await createDepositHistoryQuery().andWhere('PERSONHIST.userid1', userId);

	return data.map(rowToDeposit);
};

export const findDepositById = async (depositId) => {
	const row = await createDepositHistoryQuery().andWhere('PERSONHIST.pershistid', depositId).first();

	if (row !== undefined) {
		return {
			...rowToDeposit(row),
			user: rowToUser(row),
		};
	} else {
		return undefined;
	}
};
