exports.up = async (knex) => {
    await knex.schema.table('RVITEM', (table) => {
        table.boolean('deleted').notNull().defaultTo(false);
    });
};

exports.down = async (knex) => {
    await knex.schema.table('RVITEM', (table) => {
        table.dropColumn('deleted');
    });
};
