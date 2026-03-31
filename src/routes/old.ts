import express from 'express';
import { authenticateUserOld, authenticateUserRfidOld } from './authUtils.js';

const router = express.Router();

router.post('/v1/authenticate', authenticateUserOld());
router.post('/v1/authenticate/rfid', authenticateUserRfidOld());

export default router;
