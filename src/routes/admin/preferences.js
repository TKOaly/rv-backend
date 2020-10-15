const express = require('express');
const logger = require('../../logger');
const authMiddleware = require('../authMiddleware');
const { preferences, getPreference, setPreference, getPreferenceByKey } = require('../../db/preferences');

const router = express.Router();

router.use(authMiddleware('ADMIN', process.env.JWT_ADMIN_SECRET));

router.get('/', async (req, res) => {
    const values = await Promise.all(Object.values(preferences)
        .map(async (preference) => ({
            key: preference.key,
            value: await getPreference(preference)
        })));

    res.status(200).json({
        preferences: values
    });
});

router.get('/:preferenceKey', async (req, res) => {
    const preference = getPreferenceByKey(req.params.preferenceKey);

    if (preference === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `No preference with key '${req.params.preferenceKey}' exists`
        });

        return;
    }

    const value = await getPreference(preference);

    res.status(200).json({
        preference: {
            key: req.params.preferenceKey,
            value
        }
    });
});

router.patch('/:preferenceKey', async (req, res) => {
    const preference = getPreferenceByKey(req.params.preferenceKey);

    if (preference === undefined) {
        res.status(404).json({
            error_code: 'not_found',
            message: `No preference with key '${req.params.preferenceKey}' exists`
        });

        logger.info(
            'User %s tried to set non-existent preference \'%s\'',
            req.user.username,
            req.params.preferenceKey
        );

        return;
    }

    const result = await setPreference(preference, req.body.value);

    if (result.errors.length > 0) {
        res.status(400).json({
            error_code: 'bad_request',
            message: 'Invalid preference value',
            errors: result.errors
        });

        logger.info(
            'User %s tried to set an invalid value \'%s\' for preference \'%s\'',
            req.user.username,
            req.body.value,
            req.params.preferenceKey
        );

        return;
    }

    logger.info(
        'User %s changed preference \'%s\' from value \'%s\' to \'%s\'',
        req.user.username,
        result.previousValue,
        result.value
    );

    res.status(200).json({
        preference: {
            key: req.params.preferenceKey,
            value: result.value
        }
    });
});

module.exports = router;
