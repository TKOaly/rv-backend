import express from 'express';
import { authenticateUser } from '../authUtils.js';

const router = express.Router();

router.post('/', authenticateUser('ADMIN', process.env.JWT_ADMIN_SECRET));

export default router;
