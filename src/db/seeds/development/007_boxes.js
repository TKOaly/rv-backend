import { boxes } from '../seeddata/RVBOX.js';

export const seed = async (knex) => {
    await knex('RVBOX').insert(boxes);
};
