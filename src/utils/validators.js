const fieldValidator = require('./fieldValidator');

module.exports.numericBarcode = (fieldname) => {
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

module.exports.string = (fieldname) => {
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

module.exports.nonEmptyString = (fieldname) => {
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

module.exports.integer = (fieldname) => {
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

module.exports.positiveInteger = (fieldname) => {
    return {
        field: fieldname,
        validator: (value) => {
            if (
                typeof value === 'number' &&
                Number.isInteger(value) &&
                value > 0
            ) {
                return [];
            } else {
                return [fieldname + ' should be a positive integer'];
            }
        },
    };
};

module.exports.nonNegativeInteger = (fieldname) => {
    return {
        field: fieldname,
        validator: (value) => {
            if (
                typeof value === 'number' &&
                Number.isInteger(value) &&
                value >= 0
            ) {
                return [];
            } else {
                return [fieldname + ' should be a non-negative integer'];
            }
        },
    };
};

module.exports.objectWithFields = (fieldname, fieldValidators) => {
    return {
        field: fieldname,
        validator: (value) => {
            if (typeof value === 'object' && value !== null) {
                return fieldValidator
                    .validateObject(value, fieldValidators)
                    .map((err) => fieldname + ' ' + err);
            } else {
                return [fieldname + ' should be an object'];
            }
        },
    };
};

module.exports.orNull = ({ field, validator }) => ({
    field,
    validator: (value) => (value === null ? [] : validator(value)),
});
