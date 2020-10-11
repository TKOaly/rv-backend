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
        .first();

    if (preference.serialize) {
        value = preference.serialize(value);
    }

    if (data === undefined) {
        await knex('PREFERENCES')
            .insert({ key: preference.key, value });
    } else {
        await knex('PREFERENCES')
            .update({ value })
            .where({ key: preference.key });
    }
};

const floatPreference = {
    serialize: (value) => String(value),
    deserialize: (str) => parseFloat(str)
};

const integerPreference = {
    serialize: (value) => String(value),
    deserialize: (str) => parseInt(str)
};

module.exports.GLOBAL_DEFAULT_MARGIN = {
    ... floatPreference,
    key: 'GLOBAL_DEFAULT_MARGIN',
    default: 0.05
};

module.exports.DEFAULT_PRODUCT_CATEGORY = {
    ... integerPreference,
    key: 'DEFAULT_PRODUCT_CATEGORY',
    default: 0
};
