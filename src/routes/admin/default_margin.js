import express from 'express';
import {
    getPreference,
    preferences,
    setPreference,
} from '../../db/preferences.js';
import authMiddleware from '../authMiddleware.js';

const { GLOBAL_DEFAULT_MARGIN } = preferences;

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

export default router;
