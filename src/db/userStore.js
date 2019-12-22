const knex = require('./knex');
const bcrypt = require('bcrypt');

const rowToUser = (row) => {
    if (row !== undefined) {
        return {
            userId: row.userid,
            username: row.name,
            fullName: row.realname,
            email: row.univident,
            moneyBalance: row.saldo,
            role: row.role,
            passwordHash: row.pass
        };
    } else {
        return undefined;
    }
};

module.exports.getUsers = async () => {
    const data = await knex('RVPERSON')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select('*');
    return data.map(rowToUser);
};

module.exports.findById = async (userId) => {
    const row = await knex('RVPERSON')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select('*')
        .where('RVPERSON.userid', userId)
        .first();
    return rowToUser(row);
};

module.exports.findByUsername = async (username) => {
    const row = await knex('RVPERSON')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select('*')
        .where('RVPERSON.name', username)
        .first();
    return rowToUser(row);
};

module.exports.findByEmail = async (email) => {
    const row = await knex('RVPERSON')
        .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
        .select('*')
        .where('RVPERSON.univident', email)
        .first();
    return rowToUser(row);
};

module.exports.insertUser = async (userData) => {
    const passwordHash = bcrypt.hashSync(userData.password, 11);

    const insertedUserids = await knex('RVPERSON')
        .insert({
            createdate: new Date(),
            // roleid 2 = USER1
            roleid: 2,
            name: userData.username,
            univident: userData.email,
            pass: passwordHash,
            saldo: 0,
            realname: userData.fullName
        })
        .returning('userid');

    return {
        userId: insertedUserids[0],
        username: userData.username,
        fullName: userData.fullName,
        email: userData.email,
        moneyBalance: 0,
        role: 'USER1',
        passwordHash: passwordHash
    };
};

module.exports.verifyPassword = async (password, passwordHash) => {
    return await bcrypt.compare(password, passwordHash);
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

module.exports.recordDeposit = async (userId, amount, balanceBefore) => {
    return await knex.transaction(async (trx) => {
        const now = new Date();
        const newBalance = balanceBefore + amount;

        const insertedSaldhistids = await knex('SALDOHISTORY')
            .transacting(trx)
            .insert({
                userid: userId,
                time: now,
                saldo: newBalance,
                difference: amount
            })
            .returning('saldhistid');
        const insertedPershistids = await knex('PERSONHIST')
            .transacting(trx)
            .insert({
                time: now,
                actionid: 17,
                userid1: userId,
                userid2: userId,
                saldhistid: insertedSaldhistids[0]
            })
            .returning('pershistid');

        await knex('RVPERSON')
            .transacting(trx)
            .where({ userid: userId })
            .update({ saldo: newBalance });

        return {
            depositId: insertedPershistids[0],
            time: now.toISOString(),
            amount: amount,
            balanceAfter: newBalance
        };
    });
};
