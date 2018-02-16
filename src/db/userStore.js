const knex = require('./knex');
const bcrypt = require('bcrypt');

module.exports.findByUsername = (username) => {
    return knex('RVPERSON')
        .where('RVPERSON.name', '=', username)
        .select('*')
        .then((rows) => {
            return rows.length > 0 ? rows[0] : null;
        });
};

module.exports.verifyPassword = (password, passwordHash) => {
    return bcrypt.compare(password, passwordHash);
};

module.exports.findUserRoles = (username) => {
    return knex.select('role')
        .from('ROLE')
        .join('RVPERSON', function() {
            this.on('RVPERSON.roleid', '=', 'ROLE.roleid')
                .andOn('RVPERSON.name', '=', knex.raw('?', [username]));
        })
        .then((rows) => {
            return rows.map((row) => row.role);
        });
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