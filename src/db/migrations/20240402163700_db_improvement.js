export const up = async (knex) => {
	await knex.raw('ALTER TABLE "RVBOX" ALTER COLUMN "itemcount" SET NOT NULL');
};

export const down = async () => {};
