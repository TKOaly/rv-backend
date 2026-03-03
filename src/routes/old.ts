import express from 'express';

const router = express.Router();

router.post('/v1/authenticate', async (req, res) => { res.status(500).json({
    error_code: 'resource_gone',
    message: 'This resource has been permanently removed. Use insteed /api/v2/authenticate',
});});

router.post('/v1/authenticate/rfid', async (req, res) => { res.status(500).json({
    error_code: 'resource_gone',
    message: 'This resource has been permanently removed. Use insteed /api/v2/authenticate/rfid',
});});

export default router;
