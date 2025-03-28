import { deleteUndefinedFields } from '../utils/objectUtils.js';
import actions from './actions.js';
import knex from './knex.js';

export const rowToProduct = (row) => {
	if (row !== undefined) {
		return {
			barcode: row.barcode,
			name: row.descr,
			category: {
				categoryId: row.pgrpid,
				description: row.pgrpdescr,
			},
			buyPrice: row.buyprice,
			sellPrice: row.sellprice,
			stock: row.count,
		};
	} else {
		return undefined;
	}
};

/**
 * Return all products with match in barcode or description
 */
export const searchProducts = async (query) => {
	const data = await knex('PRICE')
		.rightJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
		.leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
		.select(
			'RVITEM.descr',
			'RVITEM.pgrpid',
			'PRODGROUP.descr as pgrpdescr',
			'PRICE.barcode',
			'PRICE.buyprice',
			'PRICE.sellprice',
			'PRICE.count'
		)
		.where((queryBuilder) => {
			queryBuilder.whereILike('RVITEM.descr', `%${query}%`).orWhereILike('PRICE.barcode', `%${query}%`);
		})
		.andWhere('PRICE.endtime', null);
	return data.map(rowToProduct);
};

/**
 * Returns all products and their stock quantities, if available.
 */
export const getProducts = async () => {
	const data = await knex('PRICE')
		.rightJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
		.leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
		.select(
			'RVITEM.descr',
			'RVITEM.pgrpid',
			'PRODGROUP.descr as pgrpdescr',
			'PRICE.barcode',
			'PRICE.buyprice',
			'PRICE.sellprice',
			'PRICE.count'
		)
		.where({ 'PRICE.endtime': null });

	return data.map(rowToProduct);
};

/**
 * Finds a product by its barcode.
 */
export const findByBarcode = async (barcode) => {
	const row = await knex('PRICE')
		.rightJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
		.leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
		.select(
			'RVITEM.descr',
			'RVITEM.pgrpid',
			'PRODGROUP.descr as pgrpdescr',
			'PRICE.barcode',
			'PRICE.buyprice',
			'PRICE.sellprice',
			'PRICE.count'
		)
		.where('PRICE.barcode', barcode)
		.andWhere('PRICE.endtime', null)
		.first();

	if (row === undefined) {
		return undefined;
	}

	return rowToProduct(row);
};

/**
 * Creates a new product if given barcode is not in use.
 */
export const insertProduct = async (productData, userId) => {
	return await knex.transaction(async (trx) => {
		const now = new Date();
		const insertedRows = await knex('RVITEM')
			.transacting(trx)
			.insert({
				pgrpid: productData.categoryId,
				descr: productData.name,
			})
			.returning(['itemid']);

		const priceRows = await knex('PRICE')
			.transacting(trx)
			.insert({
				barcode: productData.barcode,
				count: productData.stock,
				buyprice: productData.buyPrice,
				sellprice: productData.sellPrice,
				itemid: insertedRows[0].itemid,
				userid: userId,
				starttime: new Date(),
				endtime: null,
			})
			.returning('priceid');

		const categoryRow = await knex('PRODGROUP')
			.transacting(trx)
			.select('descr')
			.where('pgrpid', productData.categoryId)
			.first();

		await knex('ITEMHISTORY').transacting(trx).insert({
			time: now,
			count: productData.stock,
			actionid: actions.ITEM_CREATED,
			userid: userId,
			itemid: insertedRows[0].itemid,
			priceid1: priceRows[0].priceid,
		});

		return {
			barcode: productData.barcode,
			name: productData.name,
			category: {
				categoryId: productData.categoryId,
				description: categoryRow.descr,
			},
			buyPrice: productData.buyPrice,
			sellPrice: productData.sellPrice,
			stock: productData.stock,
		};
	});
};

/**
 * Updates a product's information
 */
export const updateProduct = async (barcode, productData, userId) => {
	/* productData may have fields { name, categoryId, buyPrice, sellPrice, stock } */
	return await knex.transaction(async (trx) => {
		const rvitemFields = deleteUndefinedFields({
			pgrpid: productData.categoryId,
			descr: productData.name,
		});
		if (Object.keys(rvitemFields).length > 0) {
			const priceRow = await knex('PRICE')
				.transacting(trx)
				.select('itemid')
				.where({ barcode: barcode, endtime: null })
				.first();

			await knex('RVITEM').transacting(trx).update(rvitemFields).where({ itemid: priceRow.itemid });
		}

		const priceFields = deleteUndefinedFields({
			count: productData.stock,
			buyprice: productData.buyPrice,
			sellprice: productData.sellPrice,
		});
		if (Object.keys(priceFields).length > 0) {
			if (priceFields.sellprice === undefined) {
				await knex('PRICE').transacting(trx).update(priceFields).where({ barcode: barcode, endtime: null });
			} else {
				/* Sell price changed, a new price row will be created. */
				const now = new Date();

				const currentPriceRows = await knex('PRICE')
					.transacting(trx)
					.update({ endtime: now })
					.where({ barcode: barcode, endtime: null })
					.returning(['barcode', 'count', 'buyprice', 'sellprice', 'itemid']);

				await knex('PRICE')
					.transacting(trx)
					.insert({
						barcode: currentPriceRows[0].barcode,
						count: currentPriceRows[0].count,
						buyprice: currentPriceRows[0].buyprice,
						sellprice: currentPriceRows[0].sellprice,
						itemid: currentPriceRows[0].itemid,
						userid: userId,
						starttime: now,
						endtime: null,

						...priceFields,
					});
			}
		}

		const productRow = await knex('PRICE')
			.transacting(trx)
			.leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
			.leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
			.select(
				'RVITEM.descr',
				'RVITEM.pgrpid',
				'PRODGROUP.descr as pgrpdescr',
				'PRICE.barcode',
				'PRICE.buyprice',
				'PRICE.sellprice',
				'PRICE.count'
			)
			.where('PRICE.barcode', barcode)
			.andWhere('PRICE.endtime', null)
			.first();
		return rowToProduct(productRow);
	});
};

/**
 * Records a product purchase in the database.
 */
export const recordPurchase = async (barcode, userId, count) => {
	return await knex.transaction(async (trx) => {
		const now = new Date();

		const updatedPriceRows = await knex('PRICE')
			.transacting(trx)
			.innerJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
			.andWhere('barcode', barcode)
			.andWhere('endtime', null)
			.decrement({ count: count })
			.returning(['priceid', 'itemid', 'sellprice', 'count']);

		const priceId = updatedPriceRows[0].priceid;
		const productId = updatedPriceRows[0].itemid;
		const price = updatedPriceRows[0].sellprice;
		const stockBefore = updatedPriceRows[0].count + count;

		const updatedPersonRows = await knex('RVPERSON')
			.transacting(trx)
			.where({ userid: userId })
			.decrement({ saldo: count * price })
			.returning(['saldo']);

		const balanceBefore = updatedPersonRows[0].saldo + count * price;

		let stock = stockBefore;
		let balance = balanceBefore;
		const insertedHistory = [];

		/* Storing multibuy into history as multiple individual history events. */
		for (let i = 0; i < count; i++) {
			stock--;
			balance -= price;

			const insertedSaldhistRows = await knex('SALDOHISTORY')
				.transacting(trx)
				.insert({
					userid: userId,
					time: now,
					saldo: balance,
					difference: -price,
				})
				.returning(['saldhistid']);
			const insertedItemhistRows = await knex('ITEMHISTORY')
				.transacting(trx)
				.insert({
					time: now,
					count: stock,
					actionid: actions.BOUGHT_BY,
					itemid: productId,
					userid: userId,
					priceid1: priceId,
					saldhistid: insertedSaldhistRows[0].saldhistid,
				})
				.returning(['itemhistid']);

			/* Storing inserted history events so they can be returned. */
			insertedHistory.push({
				purchaseId: insertedItemhistRows[0].itemhistid,
				time: now.toISOString(),
				price: price,
				balanceAfter: balance,
				stockAfter: stock,
			});
		}

		return insertedHistory;
	});
};

/**
 * Attempt to return a recently bought product
 * may fail if recent non-returned purchases were not found
 */
export const returnPurchase = async (barcode: string, userId: number): Promise<{ success: boolean }> => {
	return await knex.transaction(async (trx) => {
		const now = new Date();

		// find if user has non returned purchases
		const product = await knex('PRICE')
			.transacting(trx)
			.andWhere('barcode', barcode)
			.andWhere('endtime', null)
			.first('priceid', 'itemid');
		if (!product) {
			return { success: false };
		}

		const fiveMinutesAgo = new Date();
		fiveMinutesAgo.setTime(now.getTime() - 1000 * 60 * 5);
		const recentPurchases = await knex('ITEMHISTORY')
			.transacting(trx)
			.innerJoin('SALDOHISTORY', 'ITEMHISTORY.saldhistid', 'SALDOHISTORY.saldhistid')
			.leftJoin('ITEMHISTORY as ih2', 'ih2.itemhistid2', 'ITEMHISTORY.itemhistid')
			.andWhere('ITEMHISTORY.actionid', actions.BOUGHT_BY)
			.andWhere('ITEMHISTORY.userid', userId)
			.andWhere('ITEMHISTORY.itemid', product.itemid)
			.andWhere('ITEMHISTORY.time', '>', fiveMinutesAgo)
			.andWhere('ih2.itemhistid', null)
			.orderBy('ITEMHISTORY.time', 'desc')
			.first('ITEMHISTORY.itemhistid', 'SALDOHISTORY.difference');

		if (!recentPurchases) {
			return { success: false };
		}

		const updatedPriceRows = await knex('PRICE')
			.transacting(trx)
			.innerJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
			.andWhere('barcode', barcode)
			.andWhere('endtime', null)
			.increment({ count: 1 })
			.returning(['priceid', 'itemid', 'count']);

		const priceId = updatedPriceRows[0].priceid;
		const productId = updatedPriceRows[0].itemid;

		const updatedPersonRows = await knex('RVPERSON')
			.transacting(trx)
			.where({ userid: userId })
			.increment({ saldo: -recentPurchases.difference })
			.returning(['saldo']);

		const insertedSaldhistRows = await knex('SALDOHISTORY')
			.transacting(trx)
			.insert({
				userid: userId,
				time: now,
				saldo: updatedPersonRows[0].saldo,
				difference: -recentPurchases.difference,
			})
			.returning(['saldhistid']);

		await knex('ITEMHISTORY').transacting(trx).insert({
			time: now,
			count: updatedPriceRows[0].count,
			actionid: actions.PRODUCT_RETURNED,
			itemid: productId,
			userid: userId,
			priceid1: priceId,
			itemhistid2: recentPurchases.itemhistid,
			saldhistid: insertedSaldhistRows[0].saldhistid,
		});

		return { success: true };
	});
};

export const deleteProduct = async (barcode) => {
	return await knex.transaction(async (trx) => {
		const row = await knex('PRICE')
			.transacting(trx)
			.leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid')
			.leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid')
			.select(
				'RVITEM.descr',
				'RVITEM.pgrpid',
				'PRODGROUP.descr as pgrpdescr',
				'PRICE.barcode',
				'PRICE.buyprice',
				'PRICE.sellprice',
				'PRICE.count',
				'RVITEM.itemid'
			)
			.where('PRICE.barcode', barcode)
			.andWhere('PRICE.endtime', null)
			.first();

		if (row === undefined) {
			return undefined;
		}

		await knex('RVITEM').transacting(trx).where({ itemid: row.itemid }).update({ deleted: true });

		return rowToProduct(row);
	});
};

export const buyIn = async (barcode, count, userId) => {
	return await knex.transaction(async (trx) => {
		const row = await knex('PRICE')
			.transacting(trx)
			.where({ barcode })
			.andWhere('PRICE.endtime', null)
			.increment({ count })
			.returning(['priceid', 'itemid', 'count']);

		if (row.length === 0) {
			return undefined;
		}

		const newStock = row[0].count;

		await knex('ITEMHISTORY').transacting(trx).insert({
			time: new Date(),
			count: newStock,
			actionid: actions.PRODUCT_BUY_IN,
			itemid: row[0].itemid,
			userid: userId,
			priceid1: row[0].priceid,
		});

		return newStock;
	});
};
