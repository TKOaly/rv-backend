const knex = require('./knex');
const bcrypt = require('bcrypt');

module.exports.getUsers = async () => {
    return await knex('RVPERSON').select('*');
};

module.exports.findById = async (id) => {
    return await knex('RVPERSON')
        .where('RVPERSON.userid', '=', id)
        .select('*')
        .first();
};

module.exports.findByUsername = async (username) => {
    return await knex('RVPERSON')
        .where('RVPERSON.name', '=', username)
        .select('*')
        .first();
};

module.exports.findByEmail = async (email) => {
    return await knex('RVPERSON')
        .where('RVPERSON.univident', '=', email)
        .select('*')
        .first();
};

module.exports.insertUser = async (user) => {
    await knex('RVPERSON').insert({
        createdate: new Date(),
        // roleid 2 = normal user
        roleid: 2,
        name: user.username,
        univident: user.email.trim(),
        pass: bcrypt.hashSync(user.password, 11),
        saldo: 0,
        realname: user.realname
    });
};

module.exports.verifyPassword = async (password, passwordHash) => {
    return await bcrypt.compare(password, passwordHash);
};

module.exports.findUserRoles = async (username) => {
    const rows = await knex
        .select('role')
        .from('ROLE')
        .join('RVPERSON', (builder) => {
            builder.on('RVPERSON.roleid', '=', 'ROLE.roleid').andOn('RVPERSON.name', '=', knex.raw('?', [username]));
        });
    return rows.map((row) => row.role);
};

module.exports.updateUsername = async (userId, newUsername) => {
    await knex('RVPERSON')
        .update({ name: newUsername })
        .where({ userid: userId });
};

module.exports.updateFullName = async (userId, newFullName) => {
    await knex('RVPERSON')
        .update({ realname: newFullName })
        .where({ userid: userId });
};

module.exports.updateEmail = async (userId, newEmail) => {
    await knex('RVPERSON')
        .update({ univident: newEmail })
        .where({ userid: userId });
};

module.exports.updatePassword = async (userId, newPassword) => {
    await knex('RVPERSON')
        .update({ pass: bcrypt.hashSync(newPassword, 11) })
        .where({ userid: userId });
};

module.exports.updateAccountBalance = async (userId, newBalance) => {
    await knex('RVPERSON')
        .where({ userid: userId })
        .update({ saldo: newBalance });
};

module.exports.recordDeposit = async (userid, amount, balanceBefore) => {
    await knex.transaction(async (trx) => {
        const now = new Date();
        const newBalance = balanceBefore + amount;

        const saldhistids = await knex('SALDOHISTORY')
            .transacting(trx)
            .insert({
                userid: userid,
                time: now,
                saldo: newBalance,
                difference: amount
            })
            .returning('saldhistid');
        await knex('PERSONHIST')
            .transacting(trx)
            .insert({
                time: now,
                actionid: 17,
                userid1: userid,
                userid2: userid,
                saldhistid: saldhistids[0]
            });

        await knex('RVPERSON')
            .transacting(trx)
            .where({ userid: userid })
            .update({ saldo: newBalance });
    });
};
