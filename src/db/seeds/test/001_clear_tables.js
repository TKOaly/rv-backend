exports.seed = function(knex, Promise) {
    return knex('RVBOX')
        .del()
        .then(() => {
            return knex('ITEMHISTORY').del();
        })
        .then(() => {
            return knex('SALDOHISTORY').del();
        })
        .then(() => {
            return knex('ACTION').del();
        })
        .then(() => {
            return knex('PRICE').del();
        })
        .then(() => {
            return knex('RVITEM').del();
        })
        .then(() => {
            return knex('PRODGROUP').del();
        })
        .then(() => {
            return knex('RVPERSON').del();
        })
        .then(() => {
            return knex('ROLE').del();
        });
};
