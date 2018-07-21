const isObject = require('util').isObject;

module.exports.numericBarcode = (fieldname) => {
    return {
        field: fieldname,
        validator: (value) => {
            if (typeof value === 'string' && value.match('^\\d+$')) {
                return null;
            } else {
                return fieldname + ' should be a string of digits';
            }
        }
    };
};

module.exports.nonEmptyString = (fieldname) => {
    return {
        field: fieldname,
        validator: (value) => {
            if (typeof value === 'string' && value.length > 0) {
                return null;
            } else {
                return fieldname + ' should be a non-empty string';
            }
        }
    };
};

module.exports.nonNegativeNumber = (fieldname) => {
    return {
        field: fieldname,
        validator: (value) => {
            if (!isNaN(parseInt(value, 10)) && value >= 0) {
                return null;
            } else {
                return fieldname + ' should be a non-negative number';
            }
        }
    };
};

module.exports.positiveNumber = (fieldname) => {
    return {
        field: fieldname,
        validator: (value) => {
            if (!isNaN(parseInt(value, 10)) && value > 0) {
                return null;
            } else {
                return fieldname + ' should be a positive number';
            }
        }
    };
};

module.exports.anObject = (fieldname) => {
    return {
        field: fieldname,
        validator: (value) => {
            if (isObject(value)) {
                return null;
            } else {
                return fieldname + ' should be an object';
            }
        }
    };
};
