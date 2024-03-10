const express = require('express');
const historyStore = require('../../db/historyStore');

const router = express.Router();

router.get(
	'/depositHistory',
	async (req, res) => {
		const history = await historyStore.getDepositHistory(req.params.userId);

		res.status(200).json({
			deposits: history,
		});
	},
);

router.get(
	'/depositHistory/:depositId',
	async (req, res) => {
		const deposit = await historyStore.findDepositById(req.params.depositId);

		if (deposit === undefined) {
			res.status(404).json({
				error_code: 'not_found',
				message: `No deposit with id '${req.params.depositId}' found`,
			});

			return;
		}

		res.status(200).json({
			deposit,
		});
	},
);

router.get(
	'/purchaseHistory',
	async (req, res) => {
		const purchases = await historyStore.getPurchaseHistory();

		res.status(200).json({
			purchases,
		});
	},
);

router.get(
	'/purchaseHistory/:purchaseId',
	async (req, res) => {
		const purchase = await historyStore.findPurchaseById(req.params.purchaseId);

		if (purchase === undefined) {
			res.status(404).json({
				error_code: 'not_found',
				message: `No purchase event with ID '${req.params.purchaseId}' found`,
			});

			return;
		}

		res.status(200).json({
			purchase,
		});
	},
);

module.exports = router;
