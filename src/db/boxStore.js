const knex = require('./knex');
const deleteUndefinedFields =
	require('../utils/objectUtils').deleteUndefinedFields;

const rowToBox = (row) => {
	if (row !== undefined) {
		return {
			boxBarcode: row.barcode,
			itemsPerBox: row.itemcount,
			product: {
				barcode: row.itembarcode,
				name: row.descr,
				category: {
					categoryId: row.pgrpid,
					description: row.pgrpdescr,
				},
				buyPrice: row.buyprice,
				sellPrice: row.sellprice,
				stock: row.count,
			},
		};
	} else {
		return undefined;
	}
};

/**
 * Retrieves all boxes and their associated products.
 */
module.exports.getBoxes = async () => {
	const data = await knex('RVBOX').leftJoin(
		'PRICE',
		'RVBOX.itembarcode',
		'PRICE.barcode',
	).leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid').leftJoin(
		'PRODGROUP',
		'RVITEM.pgrpid',
		'PRODGROUP.pgrpid',
	).select(
		'RVBOX.barcode',
		'RVBOX.itemcount',
		'RVBOX.itembarcode',
		'RVITEM.descr',
		'RVITEM.pgrpid',
		'PRODGROUP.descr as pgrpdescr',
		'PRICE.buyprice',
		'PRICE.sellprice',
		'PRICE.count',
	).where('PRICE.endtime', null);
	return data.map(rowToBox);
};

/**
 * Finds a box by its barcode.
 */
module.exports.findByBoxBarcode = async (boxBarcode) => {
	const row = await knex('RVBOX').leftJoin(
		'PRICE',
		'RVBOX.itembarcode',
		'PRICE.barcode',
	).leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid').leftJoin(
		'PRODGROUP',
		'RVITEM.pgrpid',
		'PRODGROUP.pgrpid',
	).select(
		'RVBOX.barcode',
		'RVBOX.itemcount',
		'RVBOX.itembarcode',
		'RVITEM.descr',
		'RVITEM.pgrpid',
		'PRODGROUP.descr as pgrpdescr',
		'PRICE.buyprice',
		'PRICE.sellprice',
		'PRICE.count',
	).where('PRICE.endtime', null).andWhere('RVBOX.barcode', boxBarcode)
		.first();

	if (row === undefined) {
		return undefined;
	}

	return rowToBox(row);
};

/**
 * Creates a new box for a product.
 */
module.exports.insertBox = async (boxData) => {
	return await knex.transaction(async (trx) => {
		await knex('RVBOX').transacting(trx).insert({
			barcode: boxData.boxBarcode,
			itembarcode: boxData.productBarcode,
			itemcount: boxData.itemsPerBox,
		});

		const productRow = await knex('PRICE').transacting(trx).leftJoin(
			'RVITEM',
			'PRICE.itemid',
			'RVITEM.itemid',
		).leftJoin('PRODGROUP', 'RVITEM.pgrpid', 'PRODGROUP.pgrpid').select(
			'RVITEM.descr',
			'RVITEM.pgrpid',
			'PRODGROUP.descr as pgrpdescr',
			'PRICE.buyprice',
			'PRICE.sellprice',
			'PRICE.count',
		).where('PRICE.barcode', boxData.productBarcode).andWhere(
			'PRICE.endtime',
			null,
		).first();

		return {
			boxBarcode: boxData.boxBarcode,
			itemsPerBox: boxData.itemsPerBox,
			product: {
				barcode: boxData.productBarcode,
				name: productRow.descr,
				category: {
					categoryId: productRow.pgrpid,
					description: productRow.pgrpdescr,
				},
				buyPrice: productRow.buyprice,
				sellPrice: productRow.sellprice,
				stock: productRow.count,
			},
		};
	});
};

module.exports.updateBox = async (boxBarcode, boxData) => {
	return await knex.transaction(async (trx) => {
		const rvboxFields = deleteUndefinedFields({
			itembarcode: boxData.productBarcode,
			itemcount: boxData.itemsPerBox,
		});

		await knex('RVBOX').transacting(trx).update(rvboxFields).where({
			barcode: boxBarcode,
		});

		const boxRow = await knex('RVBOX').transacting(trx).leftJoin(
			'PRICE',
			'RVBOX.itembarcode',
			'PRICE.barcode',
		).leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid').leftJoin(
			'PRODGROUP',
			'RVITEM.pgrpid',
			'PRODGROUP.pgrpid',
		).select(
			'RVBOX.barcode',
			'RVBOX.itemcount',
			'RVBOX.itembarcode',
			'RVITEM.descr',
			'RVITEM.pgrpid',
			'PRODGROUP.descr as pgrpdescr',
			'PRICE.buyprice',
			'PRICE.sellprice',
			'PRICE.count',
		).where('PRICE.endtime', null).andWhere('RVBOX.barcode', boxBarcode)
			.first();
		return rowToBox(boxRow);
	});
};

module.exports.deleteBox = async (boxBarcode) => {
	return await knex.transaction(async (trx) => {
		const box = await knex('RVBOX').transacting(trx).leftJoin(
			'PRICE',
			'RVBOX.itembarcode',
			'PRICE.barcode',
		).leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid').leftJoin(
			'PRODGROUP',
			'RVITEM.pgrpid',
			'PRODGROUP.pgrpid',
		).select(
			'RVBOX.barcode',
			'RVBOX.itemcount',
			'RVBOX.itembarcode',
			'RVITEM.descr',
			'RVITEM.pgrpid',
			'PRODGROUP.descr as pgrpdescr',
			'PRICE.buyprice',
			'PRICE.sellprice',
			'PRICE.count',
		).where({ 'RVBOX.barcode': boxBarcode, 'PRICE.endtime': null }).first();

		if (box === undefined) {
			return undefined;
		}

		await knex('RVBOX').transacting(trx).where({ barcode: boxBarcode })
			.delete();

		return rowToBox(box);
	});
};

module.exports.buyIn = async (boxBarcode, boxCount) => {
	return await knex.transaction(async (trx) => {
		const row = await knex('RVBOX').transacting(trx).leftJoin(
			'PRICE',
			'RVBOX.itembarcode',
			'PRICE.barcode',
		).leftJoin('RVITEM', 'PRICE.itemid', 'RVITEM.itemid').where(
			'RVBOX.barcode',
			boxBarcode,
		).first('RVBOX.itemcount', 'PRICE.priceid', 'PRICE.count');

		if (row === undefined) {
			return undefined;
		}

		const { count, itemcount, priceid } = row;

		const newCount = count + itemcount * boxCount;

		await knex('PRICE').transacting(trx).select({ priceid, endtime: null })
			.update({ count: newCount });

		return newCount;
	});
};
