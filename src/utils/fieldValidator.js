/**
 * Validates an object.
 *
 * @param {*} obj object to validate
 * @param {*} fieldValidators list of fields and validators for each field
 */
const validateObject = (obj, fieldValidators) => {
	const errors = [];

	fieldValidators.forEach((val) => {
		if (Object.keys(obj).includes(val.field)) {
			const fieldErrors = val.validator(obj[val.field]);
			errors.push(...fieldErrors);
		} else {
			errors.push(val.field + ' is missing');
		}
	});

	return errors;
};

const validateOptionalFields = (obj, fieldValidators) => {
	const errors = [];
	let someFieldPresent = false;

	fieldValidators.forEach((val) => {
		if (Object.keys(obj).includes(val.field)) {
			someFieldPresent = true;

			const fieldErrors = val.validator(obj[val.field]);
			errors.push(...fieldErrors);
		}
	});

	if (!someFieldPresent) {
		errors.push('no fields are present');
	}

	return errors;
};

const fieldValidator = {
	validateObject,
	validateOptionalFields,
};

export default fieldValidator;
