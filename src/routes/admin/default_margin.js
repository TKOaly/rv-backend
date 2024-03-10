const express = require('express');
const authMiddleware = require('../authMiddleware');
const { GLOBAL_DEFAULT_MARGIN, getPreference, setPreference } = require(
	'../../db/preferences',
);

const router = express.Router();

router.use(authMiddleware('ADMIN', process.env.JWT_ADMIN_SECRET));

router.get('/', async (_req, res) => {
	const margin = await getPreference(GLOBAL_DEFAULT_MARGIN);
	res.status(200).json({ margin });
});

router.patch('/', async (req, res) => {
	await setPreference(GLOBAL_DEFAULT_MARGIN, req.body.margin);
	res.status(200).send();
});

module.exports = router;
