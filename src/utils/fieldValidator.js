/**
 * Validates an object.
 *
 * @param {*} obj object to validate
 * @param {*} fieldValidators list of fields and validators for each field
 */
module.exports.validateObject = (obj, fieldValidators) => {
    const errors = [];
    fieldValidators.forEach((v) => {
        if (Object.keys(obj).includes(v.field)) {
            const error = v.validator(obj[v.field]);
            error && errors.push(error);
        } else {
            errors.push(v.field + ' is missing');
        }
    });

    return errors;
};
