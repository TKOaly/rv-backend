const knex = require('./knex');
const bcrypt = require('bcrypt');

module.exports.getUsers = () => {
    return knex('RVPERSON')
        .select('*')
        .then((persons) => {
            return persons;
        });
};

module.exports.findById = (id) => {
    return knex('RVPERSON')
        .where('RVPERSON.userid', '=', id)
        .select('*')
        .first();
};

module.exports.findByUsername = (username) => {
    return knex('RVPERSON')
        .where('RVPERSON.name', '=', username)
        .select('*')
        .first();
};

module.exports.findByEmail = (email) => {
    return knex('RVPERSON')
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

module.exports.verifyPassword = (password, passwordHash) => {
    return bcrypt.compare(password, passwordHash);
};

module.exports.findUserRoles = (username) => {
    return knex
        .select('role')
        .from('ROLE')
        .join('RVPERSON', function() {
            this.on('RVPERSON.roleid', '=', 'ROLE.roleid').andOn('RVPERSON.name', '=', knex.raw('?', [username]));
        })
        .then((rows) => {
            return rows.map((row) => row.role);
        });
};

module.exports.updateUsername = (userId, newUsername) => {
    return knex('RVPERSON')
        .update({ name: newUsername })
        .where({ userid: userId });
};

module.exports.updateFullName = (userId, newFullName) => {
    return knex('RVPERSON')
        .update({ realname: newFullName })
        .where({ userid: userId });
};

module.exports.updateEmail = (userId, newEmail) => {
    return knex('RVPERSON')
        .update({ univident: newEmail })
        .where({ userid: userId });
};

module.exports.updatePassword = (userId, newPassword) => {
    return knex('RVPERSON')
        .update({ pass: bcrypt.hashSync(newPassword, 11) })
        .where({ userid: userId });
};

module.exports.updateAccountBalance = async (userId, newBalance) => {
    await knex('RVPERSON')
        .where({ userid: userId })
        .update({ saldo: newBalance });
};

module.exports.recordDeposit = async (userid, amount, balanceBefore) => {
    return knex.transaction(async (trx) => {
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
