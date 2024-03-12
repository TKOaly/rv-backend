import express from 'express';
import knex from '../../db/knex.js';

const router = express.Router();

router.post('/', async (req, res) => {
	if (!['test', 'development', 'ci'].includes(process.env.NODE_ENV)) {
		return res.status(500).json({
			message: 'API not running in development, test or CI environment',
			error: true,
		});
	}
	try {
		await knex.migrate.rollback();
		await knex.migrate.latest();
		await knex.seed.run();
		return res.status(200).json({ message: 'Successfully reset API data', error: false });
	} catch (err) {
		return res.status(500).json({ message: 'Error resetting API data', error: true });
	}
});

export default router;
