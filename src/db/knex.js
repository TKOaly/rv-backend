import { default as Knex } from 'knex';
import config from '../../knexfile.js';

const environment = process.env.NODE_ENV || 'development';

const knex = Knex(config[environment]);

export default knex;
