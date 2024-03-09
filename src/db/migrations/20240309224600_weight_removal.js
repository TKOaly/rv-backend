exports.up = async (knex) => {
    await knex.raw('DROP VIEW "RVITEM"');
    await knex.raw('ALTER TABLE "RVITEM_ALL" DROP COLUMN "weight"');
    await knex.raw(
        'CREATE VIEW "RVITEM" AS SELECT * FROM "RVITEM_ALL" WHERE deleted IS FALSE',
    );
};

exports.down = async () => {};
