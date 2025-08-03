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
		product: rowToProduct(row),
		user: rowToUser(row),
		returned: row.returned,
		returnedTime: row.returnedTime ? new Date(row.returnedTime).toISOString() : '',
		returnedBalanceAfter: row.saldo2,
		isReturnAction: row.isReturnAction,
	};
};

const rowToDeposit = (row) => {
	return {
		depositId: row.pershistid,
		time: new Date(row.time).toISOString(),
		amount: row.difference,
		balanceAfter: row.saldo,
		type: row.actionid,
		user: rowToUser(row),
	};
};

export const createPurchaseHistoryQuery = () =>
	knex('ITEMHISTORY')
		.leftJoin('PRICE', 'ITEMHISTORY.priceid1', 'PRICE.priceid')
		.leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
		.leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
		.leftJoin('RVPERSON', 'ITEMHISTORY.userid', 'RVPERSON.userid')
		.leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
		.leftJoin('SALDOHISTORY', 'ITEMHISTORY.saldhistid', 'SALDOHISTORY.saldhistid')
		.leftJoin('ITEMHISTORY as ih2', 'ih2.itemhistid2', 'ITEMHISTORY.itemhistid')
		.leftJoin('SALDOHISTORY as sh2', 'sh2.saldhistid', 'ih2.saldhistid')
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
			'ROLE.role',
			'SALDOHISTORY.saldo',
			'RVPERSON.privacy_level',
			knex.raw('(ih2.itemhistid2 is not null) as returned'),
			'ih2.time as returnedTime',
			'sh2.saldo as saldo2',
			knex.raw('CASE WHEN ih2.itemhistid IS NOT NULL THEN true ELSE false END as isReturnAction')
		)
		.where('ITEMHISTORY.actionid', actions.BOUGHT_BY)
		.andWhere('PRICE.endtime', null)
		.orderBy([
			{ column: 'ITEMHISTORY.time', order: 'desc' },
			{ column: 'ITEMHISTORY.itemhistid', order: 'desc' },
		]);

export const createDepositHistoryQuery = () =>
	knex('PERSONHIST')
		.leftJoin('SALDOHISTORY', 'PERSONHIST.saldhistid', 'SALDOHISTORY.saldhistid')
		.leftJoin('RVPERSON', 'PERSONHIST.userid1', 'RVPERSON.userid')
		.leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
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
			'ROLE.role',
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
	if (offset) query = query.offset(offset);
	if (limit) query = query.limit(limit);
	const data = await query;

	return data.map((row) => rowToPurchase(row));
};

export const getUserPurchaseHistory = async (userId) => {
	const data = await createPurchaseHistoryQuery().andWhere('ITEMHISTORY.userid', userId);
	return data.map(rowToPurchase);
};

export const getProductPurchaseHistory = async (barcode) => {
	const data = await createPurchaseHistoryQuery().andWhere('PRICE.barcode', barcode);
	return data.map(rowToPurchase);
};

export const findPurchaseById = async (purchaseId) => {
	const row = await createPurchaseHistoryQuery().andWhere('ITEMHISTORY.itemhistid', purchaseId).first();

	if (row !== undefined) {
		return rowToPurchase(row);
	} else {
		return undefined;
	}
};

export const getDepositHistory = async (offset?: number, limit?: number) => {
	let query = createDepositHistoryQuery();
	if (offset) query = query.offset(offset);
	if (limit) query = query.limit(limit);
	const data = await query;

	return data.map((row) => rowToDeposit(row));
};

export const getUserDepositHistory = async (userId) => {
	const data = await createDepositHistoryQuery().andWhere('PERSONHIST.userid1', userId);

	return data.map(rowToDeposit);
};

export const findDepositById = async (depositId) => {
	const row = await createDepositHistoryQuery().andWhere('PERSONHIST.pershistid', depositId).first();

	if (row !== undefined) {
		return rowToDeposit(row);
	} else {
		return undefined;
	}
};

export const getNumberOfPurchases = async () => {
	const latestLog = await knex('ITEMHISTORY').orderBy('itemhistid', 'desc').limit(1);
	return latestLog[0];
};

export const getNumberOfDeposits = async () => {
	const latestLog = await knex('PERSONHIST').orderBy('pershistid', 'desc').limit(1);
	return latestLog[0];
};

export const getCombinedHistory = async (offset?: number, limit?: number) => {
	const purchases = await getPurchaseHistory(offset, limit);
	const deposits = await getDepositHistory(offset, limit);

	const combinedHistory = [...purchases, ...deposits];

	combinedHistory.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

	return combinedHistory;
};