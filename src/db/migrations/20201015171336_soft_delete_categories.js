exports.up = async (knex) => {
    await knex.raw('ALTER TABLE "PRODGROUP" RENAME TO "PRODGROUP_ALL"');

    await knex.schema.table('PRODGROUP_ALL', (table) => {
        table.boolean('deleted').notNull().defaultTo(false);
    });

    await knex.raw('CREATE VIEW "PRODGROUP" AS SELECT * FROM "PRODGROUP_ALL" WHERE deleted IS FALSE');
};

exports.down = async (knex) => {
    await knex.raw('DROP VIEW "PRODGROUP"');

    await knex.schema.table('PRODGROUP_ALL', (table) => {
        table.dropColumn('deleted');
    });

    await knex.raw('ALTER TABLE "PRODGROUP_ALL" RENAME TO "PRODGROUP"');
};
