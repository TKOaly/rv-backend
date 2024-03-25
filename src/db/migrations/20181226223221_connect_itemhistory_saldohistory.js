export const up = async (knex) => {
	if (await knex.schema.hasColumn('ITEMHISTORY', 'saldhistid')) {
		return;
	}

	const itemhistory = await knex('ITEMHISTORY')
		.leftJoin('PRICE', 'ITEMHISTORY.priceid1', 'PRICE.priceid')
		.select('ITEMHISTORY.itemhistid', 'ITEMHISTORY.time', 'ITEMHISTORY.userid', 'PRICE.sellprice')
		.where('ITEMHISTORY.actionid', 5)
		.orderBy(['ITEMHISTORY.time', 'ITEMHISTORY.userid', 'PRICE.sellprice']);
	const saldohistory = await knex('SALDOHISTORY')
		.select('saldhistid', 'time', 'userid', 'difference')
		.orderBy(['time', 'userid', { column: 'difference', order: 'desc' }]);

	/* It is guaranteed that there is always one saldo event for every item event. However sometimes there are batches
	 * of n item events and n saldo events with the same timestamps, userids and prices/saldo changes. These are called
	 * multibuys. This algorithm splits the history into multibuys and then uses clever tricks to determine which saldo
	 * event maps to which item event inside a multibuy.
	 *
	 * Because the history datasets are ordered by the same columns, it is also guaranteed that item events and
	 * corresponding saldo events are encountered in the same order. This allows using the two pointers technique for
	 * performance optimization. */
	let itemIndex = 0;
	let saldoIndex = 0;
	while (itemIndex < itemhistory.length) {
		const itemEvent = itemhistory[itemIndex];

		/* Iterating item events of current multibuy and storing them.
			We can break as soon as the next item event is not part of the multibuy. */
		const multibuyItemEvents = [];
		while (itemIndex < itemhistory.length && isSameMultibuy(itemEvent, itemhistory[itemIndex])) {
			multibuyItemEvents.push(itemhistory[itemIndex]);
			itemIndex++;
		}

		/* Item events are now stored, so concentrating on the saldo array. First skipping saldo events that are not
		 * related to purchases (such as deposits). */
		while (saldoIndex < saldohistory.length && !isMultibuySaldoEvent(itemEvent, saldohistory[saldoIndex])) {
			saldoIndex++;
		}

		/* Iterating saldo events of current multibuy and storing them. Also might catch deposits if they happened at
		 * the same time by the same user and had same saldo difference than elements of the multibuy. */
		const multibuySaldoEvents = [];
		while (saldoIndex < saldohistory.length && isMultibuySaldoEvent(itemEvent, saldohistory[saldoIndex])) {
			multibuySaldoEvents.push(saldohistory[saldoIndex]);
			saldoIndex++;
		}

		/* There are now arrays for item events and saldo events of the multibuy. It doesn't really matter which order
		 * the item events come in, as they have the same timestamp anyway. On saldo events however order does matter,
		 * because the saldo readings (user saldo after purchase) should be in order.
		 *
		 * If the sell price is negative, the saldo readings should increase, so saldo events are sorted by saldo in
		 * ascending order. If it is positive, the saldo readings should decrease. */
		if (itemEvent.sellprice < 0) {
			multibuySaldoEvents.sort((a, b) => a.saldo - b.saldo);
		} else {
			multibuySaldoEvents.sort((a, b) => b.saldo - a.saldo);
		}

		/* References to saldo events are inserted into item events. Now there is a slight chance that there was a
		 * deposit with the same time, userid and saldo difference, so the saldo events are only iterated so far as the
		 * item event array length. */
		for (let i = 0; i < multibuyItemEvents.length; i++) {
			multibuyItemEvents[i].saldhistid = multibuySaldoEvents[i].saldhistid;
		}
	}

	await knex.schema.table('ITEMHISTORY', (table) => {
		table.integer('saldhistid').references('saldhistid').inTable('SALDOHISTORY').defaultTo(null);
	});

	/* This might take really long time, optimizations needed. */
	for (const itemEvent of itemhistory) {
		await knex('ITEMHISTORY').update('saldhistid', itemEvent.saldhistid).where('itemhistid', itemEvent.itemhistid);
	}
};

export const down = async (knex) => {
	if (process.env.NODE_ENV !== 'production') {
		if (await knex.schema.hasColumn('ITEMHISTORY', 'saldhistid')) {
			await knex.schema.table('ITEMHISTORY', (table) => {
				table.dropColumn('saldhistid');
			});
		}
	} else {
		throw new Error('dont drop stuff in production');
	}
};

const isSameMultibuy = (itemEvent, nextEvent) => {
	if (nextEvent === undefined) {
		throw new Error(`nextEvent is undefined for itemEvent ${JSON.stringify(itemEvent)}`);
	}

	return (
		itemEvent.time.getTime() === nextEvent.time.getTime() &&
		itemEvent.userid === nextEvent.userid &&
		itemEvent.sellprice === nextEvent.sellprice
	);
};

const isMultibuySaldoEvent = (itemEvent, saldoEvent) => {
	if (saldoEvent === undefined) {
		throw new Error(`saldoEvent is undefined for itemEvent ${JSON.stringify(itemEvent)}`);
	}

	// Weird edge cases in production data
	if (
		(itemEvent.sellprice === '65' && saldoEvent.difference === '-60') ||
		(itemEvent.sellprice === '60' && saldoEvent.difference === '-62') ||
		(itemEvent.sellprice === '57' && saldoEvent.difference === '-59')
	) {
		return itemEvent.time.getTime() === saldoEvent.time.getTime() && itemEvent.userid === saldoEvent.userid;
	}

	return (
		itemEvent.time.getTime() === saldoEvent.time.getTime() &&
		itemEvent.userid === saldoEvent.userid &&
		Number(itemEvent.sellprice) === -1 * Number(saldoEvent.difference)
	);
};
