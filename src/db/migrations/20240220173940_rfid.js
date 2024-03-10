exports.up = async (knex) => {
	await knex.raw('ALTER TABLE "RVPERSON" ADD COLUMN "rfid" TEXT');
};

exports.down = async (knex) => {
	if (process.env.NODE_ENV !== 'production') {
		await knex.raw('ALTER TABLE "RVPERSON" DROP COLUMN "rfid"');
	} else {
		throw new Error('dont drop stuff in production');
	}
};
