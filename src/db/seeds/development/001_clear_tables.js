export const seed = async (knex) => {
    await knex('PERSONHIST').del();
    await knex('RVBOX').del();
    await knex('ITEMHISTORY').del();
    await knex('SALDOHISTORY').del();
    await knex('ACTION').del();
    await knex('PRICE').del();
    await knex('RVITEM').del();
    await knex('PRODGROUP').del();
    await knex('RVPERSON').del();
    await knex('ROLE').del();
};
