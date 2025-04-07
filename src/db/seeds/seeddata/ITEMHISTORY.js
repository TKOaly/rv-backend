import { rvitems } from './RVITEM.js';

function getRandomInteger(min, max) {
	const min_number = Math.ceil(min);
	const max_number = Math.floor(max);
	return Math.floor(Math.random() * (max_number - min_number + 1)) + min_number;
}

export const itemhistory = [
	{
		itemhistid: 1,
		time: new Date('2018-12-24T00:00:00Z'),
		count: 101,
		itemid: 1750,
		userid: 1,
		actionid: 5,
		priceid1: 822,
		priceid2: null,
		saldhistid: 1,
	},
	{
		itemhistid: 2,
		time: new Date('2018-12-24T00:00:01Z'),
		count: 100,
		itemid: 1800,
		userid: 1,
		actionid: 5,
		priceid1: 877,
		priceid2: null,
		saldhistid: 2,
	},
	// admin changed sellprice
	{
		itemhistid: 3,
		time: new Date('2018-12-24T00:00:02Z'),
		count: 100,
		itemid: 1800,
		userid: 2,
		actionid: 7,
		priceid1: 877,
		priceid2: 899,
		saldhistid: null,
	},
	{
		itemhistid: 4,
		time: new Date('2018-12-24T00:00:05Z'),
		count: 101,
		itemid: 1756,
		userid: 1,
		actionid: 5,
		priceid1: 827,
		priceid2: null,
		saldhistid: 4,
	},
	// two different products bought at the same time
	{
		itemhistid: 5,
		time: new Date('2018-12-24T00:00:10Z'),
		count: 100,
		itemid: 1756,
		userid: 1,
		actionid: 5,
		priceid1: 827,
		priceid2: null,
		saldhistid: 6,
	},
	{
		itemhistid: 6,
		time: new Date('2018-12-24T00:00:10Z'),
		count: 100,
		itemid: 1750,
		userid: 1,
		actionid: 5,
		priceid1: 822,
		priceid2: null,
		saldhistid: 7,
	},
	// two same products bought at the same time
	{
		itemhistid: 7,
		time: new Date('2018-12-24T00:00:15Z'),
		count: 101,
		itemid: 1772,
		userid: 1,
		actionid: 5,
		priceid1: 847,
		priceid2: null,
		saldhistid: 9,
	},
	{
		itemhistid: 8,
		time: new Date('2018-12-24T00:00:15Z'),
		count: 100,
		itemid: 1772,
		userid: 1,
		actionid: 5,
		priceid1: 847,
		priceid2: null,
		saldhistid: 10,
	},
	// product bougth and returned
	{
		itemhistid: 9,
		time: new Date('2019-11-24T00:00:15Z'),
		count: 101,
		itemid: 10,
		userid: 1,
		actionid: 5,
		priceid1: 5,
		priceid2: null,
		saldhistid: 11,
	},
	{
		itemhistid: 10,
		time: new Date('2019-11-24T00:01:15Z'),
		count: 101,
		itemid: 10,
		userid: 2,
		actionid: 5,
		priceid1: 5,
		priceid2: null,
		saldhistid: 12,
	},
	{
		itemhistid: 11,
		time: new Date('2019-11-24T00:03:15Z'),
		count: 101,
		itemid: 10,
		userid: 1,
		actionid: 28,
		priceid1: 5,
		priceid2: null,
		saldhistid: 13,
		itemhistid2: 9,
	},
	// Can return
	{
		itemhistid: 12,
		time: new Date('2019-12-25T00:00:15Z'),
		count: -44062,
		itemid: 58,
		userid: 1,
		actionid: 5,
		priceid1: 105,
		priceid2: null,
		saldhistid: 16,
	},
	{
		itemhistid: 13,
		time: new Date('2019-12-25T00:01:15Z'),
		count: -44062,
		itemid: 58,
		userid: 2,
		actionid: 5,
		priceid1: 105,
		priceid2: null,
		saldhistid: 17,
	},
	{
		itemhistid: 14,
		time: new Date('2019-12-25T00:03:15Z'),
		count: -44062,
		itemid: 58,
		userid: 1,
		actionid: 28,
		priceid1: 105,
		priceid2: null,
		saldhistid: 18,
		itemhistid2: 12,
	},
];

//Creates 5000 somewhat random itemhistory logs when container is recreated
const validItemIds = rvitems.map((item) => item.itemid);

for (let i = itemhistory.length + 1; i <= 5008; i++) {
	const randomItemId = validItemIds[getRandomInteger(0, validItemIds.length - 1)];

	itemhistory.push({
		itemhistid: i,
		time: new Date('2018-12-24T00:00:15Z'),
		count: getRandomInteger(50, 150),
		itemid: randomItemId,
		userid: getRandomInteger(1, 3),
		actionid: 5,
		priceid1: 847,
		priceid2: null,
		saldhistid: 10,
	});
}
