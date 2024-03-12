import knex from './knex.js';

export const getPreference = async (preference) => {
	const data = await knex('PREFERENCES').where({ key: preference.key }).first('value');

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

export const setPreference = async (preference, value) => {
	const data = await knex('PREFERENCES').where({ key: preference.key }).first('value');

	if (preference.validate) {
		const errors = preference.validate(value);

		if (errors.length > 0) {
			return {
				previousValue: undefined,
				value,
				errors,
			};
		}
	}

	let serialized = value;

	if (preference.serialize) {
		serialized = preference.serialize(value);
	}

	if (data === undefined) {
		await knex('PREFERENCES').insert({
			key: preference.key,
			value: serialized,
		});

		return {
			errors: [],
			value,
			previousValue: undefined,
		};
	} else {
		await knex('PREFERENCES').update({ value: serialized }).where({ key: preference.key });

		return {
			errors: [],
			value,
			previousValue: data.value,
		};
	}
};

const floatPreference = {
	serialize: (value) => String(value),
	deserialize: (str) => Number.parseFloat(str),
	validate: (value) => (typeof value === 'number' ? [] : ['value should be a number']),
};

const integerPreference = {
	serialize: (value) => String(value),
	deserialize: (str) => Number.parseInt(str),
	validate: (value) =>
		typeof value !== 'number'
			? ['value should be a number']
			: !Number.isInteger(value)
			  ? ['value should be an integer']
			  : [],
};

export const preferences = {
	GLOBAL_DEFAULT_MARGIN: {
		...floatPreference,
		key: 'globalDefaultMargin',
		default: 0.05,
	},

	DEFAULT_PRODUCT_CATEGORY: {
		...integerPreference,
		key: 'defaultProductCategory',
		default: 0,
	},
};

export const getPreferenceByKey = (key) => {
	return Object.values(preferences).find((pref) => pref.key === key);
};
