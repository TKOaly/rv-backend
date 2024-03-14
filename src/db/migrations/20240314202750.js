export const up = async (knex) => {
	await knex.raw('ALTER TABLE "ROLE" DROP COLUMN "buzzerlimit"');
};

export const down = async () => {};
