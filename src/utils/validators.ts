import fieldValidator from './fieldValidator.js';

export const numericBarcode = (fieldname) => {
	return {
		field: fieldname,
		validator: (value) => {
			if (typeof value === 'string' && value.match(/^\d{1,14}$/)) {
				return [];
			} else {
				return [fieldname + ' should be a numeric 1-14 digit barcode'];
			}
		},
	};
};

export const string = (fieldname) => {
	return {
		field: fieldname,
		validator: (value) => {
			if (typeof value === 'string') {
				return [];
			} else {
				return [fieldname + ' should be a string'];
			}
		},
	};
};

export const nonEmptyString = (fieldname) => {
	return {
		field: fieldname,
		validator: (value) => {
			if (typeof value === 'string' && value.length > 0) {
				return [];
			} else {
				return [fieldname + ' should be a non-empty string'];
			}
		},
	};
};

export const integer = (fieldname) => {
	return {
		field: fieldname,
		validator: (value) => {
			if (typeof value === 'number' && Number.isInteger(value)) {
				return [];
			} else {
				return [fieldname + ' should be an integer'];
			}
		},
	};
};

export const positiveInteger = (fieldname) => {
	return {
		field: fieldname,
		validator: (value) => {
			if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
				return [];
			} else {
				return [fieldname + ' should be a positive integer'];
			}
		},
	};
};

export const nonNegativeInteger = (fieldname) => {
	return {
		field: fieldname,
		validator: (value) => {
			if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
				return [];
			} else {
				return [fieldname + ' should be a non-negative integer'];
			}
		},
	};
};

export const objectWithFields = (fieldname, fieldValidators) => {
	return {
		field: fieldname,
		validator: (value) => {
			if (typeof value === 'object' && value !== null) {
				return fieldValidator.validateObject(value, fieldValidators).map((err) => fieldname + ' ' + err);
			} else {
				return [fieldname + ' should be an object'];
			}
		},
	};
};

export const orNull = ({ field, validator }) => ({
	field,
	validator: (value) => (value === null ? [] : validator(value)),
});
