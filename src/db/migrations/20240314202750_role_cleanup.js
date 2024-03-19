export const up = async (knex) => {
	await knex.raw('ALTER TABLE "ROLE" DROP COLUMN "buzzerlimit"');
	await knex.raw('ALTER TABLE "ROLE" DROP COLUMN "bgcolor"');
	await knex.raw('ALTER TABLE "ROLE" DROP COLUMN "fgcolor"');
};

export const down = async () => {};
