exports.up = async (knex) => {
	await knex.raw('ALTER TABLE "RVPERSON" ADD COLUMN "rfid" TEXT');
};

exports.down = async (knex) => {
    if (process.env.NODE_ENV !== 'production') {
        throw new Error('not implemented');
    } else {
        throw new Error('dont drop stuff in production');
    }
};
