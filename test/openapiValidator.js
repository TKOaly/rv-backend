const chaiResponseValidator = require('chai-openapi-response-validator');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const apiContract = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, '../openapi.yaml')));
module.exports = chaiResponseValidator(apiContract);
