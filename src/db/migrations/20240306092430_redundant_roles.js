export const up = async (knex) => {
    await knex('ROLE').whereIn('role', ['USER3', 'USER4', 'MULKKU']).delete();
};

export const down = async (_knex) => {
    // No need to revert this as in theory it's uknown which of these roles existed
};
