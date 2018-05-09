const fieldValidator = require('./fieldValidator');
const isObject = require('util').isObject;

module.exports.numericBarcode = fieldname => {
    return {
        field: fieldname,
        validator: fieldValidator.createValidator(
            v => typeof v === 'string' && v.match('^\\d+$'),
            fieldname + ' should be a string of digits'
        )
    };
};

module.exports.nonEmptyString = fieldname => {
    return {
        field: fieldname,
        validator: fieldValidator.createValidator(
            v => typeof v === 'string' && v && v.length > 0,
            fieldname + ' should be a non-empty string'
        )
    };
};

module.exports.nonNegativeNumber = fieldname => {
    return {
        field: fieldname,
        validator: fieldValidator.createValidator(
            v => !isNaN(parseInt(v, 10)) && v >= 0,
            fieldname + ' should be a non-negative number'
        )
    };
};

module.exports.positiveNumber = fieldname => {
    return {
        field: fieldname,
        validator: fieldValidator.createValidator(
            v => !isNaN(parseInt(v, 10)) && v > 0,
            fieldname + ' should be a positive number'
        )
    };
};

module.exports.anObject = fieldname => {
    return {
        field: fieldname,
        validator: fieldValidator.createValidator(
            v => isObject(v),
            fieldname + ' should be an object'
        )
    };
};
