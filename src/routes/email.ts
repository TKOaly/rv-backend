import express from 'express';
import nodemailer from 'nodemailer';
import { requireRvTerminalSecretMiddleware, type Authenticated_request } from './authMiddleware.js';
import * as userStore from '../db/userStore.js';
import logger from '../logger.js';

const router = express.Router();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
});

router.use(requireRvTerminalSecretMiddleware());

router.post('/temp_password', async (req: Authenticated_request, res) => {
    const userId = req.body.userId;
    const user = await userStore.findById(userId);
    const tempPassword = await userStore.createTempPassword(user.userId, user.username);
    logger.info("Temporary password generated for user %s ", user.username);
    const info = await transporter.sendMail({
        from: process.env.EMAIL_ADDERS,
        to: user.email,
        subject: 'Temporary RV password',
        text: `Hi ${user.fullName.split(' ').at(0)}!\n\nYour RV username is ${user.username} and the temporary password for your account is ${tempPassword}.\nThe temporary password will work for the next 15 minutes.\nKind regards\nThe RV team`,
        // html: TODO
    });

    logger.info("Sent email %s ", info.messageId);
	res.status(201).json({
        message: 'Temporary password created successfully.',
    });
});

export default router
