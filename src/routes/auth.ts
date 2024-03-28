import express from 'express';
import { authenticateUser, authenticateUserRfid } from './authUtils.js';

const router = express.Router();

router.post('/', authenticateUser());
router.post('/rfid', authenticateUserRfid());

export default router;
