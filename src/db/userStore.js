const knex = require('./knex');
const bcrypt = require('bcrypt');
const deleteUndefinedFields = require('../utils/objectUtils').deleteUndefinedFields;

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

module.exports.updateUser = async (userId, userData) => {
    return await knex.transaction(async (trx) => {
        const rvpersonFields = deleteUndefinedFields({
            name: userData.username,
            realname: userData.fullName,
            univident: userData.email,
            saldo: userData.moneyBalance
        });
        if (userData.password !== undefined) {
            rvpersonFields.pass = bcrypt.hashSync(userData.password, 11);
        }
        if (userData.role !== undefined) {
            const roleid = await knex('ROLE')
                .transacting(trx)
                .select('roleid')
                .where({ role: userData.role })
                .first();
            rvpersonFields.roleid = roleid;
        }
        await knex('RVPERSON')
            .transacting(trx)
            .update(rvpersonFields)
            .where({ userid: userId });

        const userRow = await knex('RVPERSON')
            .transacting(trx)
            .leftJoin('ROLE', 'RVPERSON.roleid', 'ROLE.roleid')
            .select('*')
            .where('RVPERSON.userid', userId)
            .first();
        return rowToUser(userRow);
    });
};

module.exports.verifyPassword = async (password, passwordHash) => {
    return await bcrypt.compare(password, passwordHash);
};

module.exports.recordDeposit = async (userId, amount) => {
    return await knex.transaction(async (trx) => {
        const now = new Date();

        const updatedSaldos = await knex('RVPERSON')
            .transacting(trx)
            .where({ userid: userId })
            .increment({ saldo: amount })
            .returning('saldo');

        const insertedSaldhistids = await knex('SALDOHISTORY')
            .transacting(trx)
            .insert({
                userid: userId,
                time: now,
                saldo: updatedSaldos[0],
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

        return {
            depositId: insertedPershistids[0],
            time: now.toISOString(),
            amount: amount,
            balanceAfter: updatedSaldos[0]
        };
    });
};
