const knex = require('./knex');

module.exports.getPreference = async (preference) => {
    const data = await knex('PREFERENCES')
        .where({ key: preference.key })
        .first('value');

    if (data === undefined) {
        if (preference.default !== undefined) {
            return preference.default;
        } else {
            return null;
        }
    } else {
        if (preference.deserialize) {
            return preference.deserialize(data.value);
        } else {
            return data.value;
        }
    }
};

module.exports.setPreference = async (preference, value) => {
    const data = await knex('PREFERENCES')
        .where({ key: preference.key })
        .first('value');

    if (preference.validate) {
        const errors = preference.validate(value);

        if (errors.length > 0) {
            return {
                previousValue: undefined,
                value,
                errors
            };
        }
    }

    let serialized = value;

    if (preference.serialize) {
        serialized = preference.serialize(value);
    }

    if (data === undefined) {
        await knex('PREFERENCES')
            .insert({ key: preference.key, value: serialized });

        return {
            errors: [],
            value,
            previousValue: undefined
        };
    } else {
        await knex('PREFERENCES')
            .update({ value: serialized })
            .where({ key: preference.key });

        return {
            errors: [],
            value,
            previousValue: data.value
        };
    }
};

const floatPreference = {
    serialize: (value) => String(value),
    deserialize: (str) => parseFloat(str),
    validate: (value) => typeof value === 'number' ? [] : ['value should be a number']
};

const integerPreference = {
    serialize: (value) => String(value),
    deserialize: (str) => parseInt(str),
    validate: (value) =>
        typeof value !== 'number' ? ['value should be a number'] :
            !Number.isInteger(value) ? ['value should be an integer'] : []
};

module.exports.preferences = {
    GLOBAL_DEFAULT_MARGIN: {
        ... floatPreference,
        key: 'globalDefaultMargin',
        default: 0.05
    },

    DEFAULT_PRODUCT_CATEGORY: {
        ... integerPreference,
        key: 'defaultProductCategory',
        default: 0
    }
};

Object.assign(module.exports, module.exports.preferences);

module.exports.getPreferenceByKey = (key) => {
    return Object.values(module.exports.preferences)
        .find((pref) => pref.key === key);
};
