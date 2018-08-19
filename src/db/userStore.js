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

module.exports.findHighestUserId = () => {
    return knex('RVPERSON')
        .max('userid')
        .first();
};

module.exports.findByEmail = (email) => {
    return knex('RVPERSON')
        .where('RVPERSON.univident', '=', email)
        .select('*')
        .first();
};

module.exports.insertUser = (user, highestId) => {
    return knex('RVPERSON').insert({
        userid: highestId + 1,
        createdate: new Date(),
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

module.exports.updateAccountBalance = (username, difference) => {
    return knex.transaction(function(trx) {
        return knex
            .transacting(trx)
            .select('userid', 'saldo')
            .from('RVPERSON')
            .where({ name: username })
            .then((rows) => rows[0])
            .then((user) => {
                user.saldo += difference;
                return knex('RVPERSON')
                    .transacting(trx)
                    .where({ name: username })
                    .update({
                        saldo: user.saldo
                    })
                    .then(() => user);
            })
            .then((user) => {
                return knex
                    .transacting(trx)
                    .insert({
                        userid: user.userid,
                        time: new Date(),
                        saldo: user.saldo,
                        difference: difference
                    })
                    .into('SALDOHISTORY')
                    .then(() => user.saldo);
            });
    });
};
