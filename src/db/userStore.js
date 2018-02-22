const knex = require('./knex');
const bcrypt = require('bcrypt');

module.exports.getUsers = (username) => {
    return knex('RVPERSON')
        .select('*')
        .then((persons) => {
            return persons;
        });
};

module.exports.findByUsername = (username) => {
    return knex('RVPERSON')
        .where('RVPERSON.name', '=', username)
        .select('*')
        .then((rows) => {
            return rows.length > 0 ? rows[0] : null;
        });
};

module.exports.findByEmail = (email) => {
    return knex('RVPERSON')
        .where('RVPERSON.univident', '=', email)
        .select('*')
        .then((rows) => {
            return rows.length > 0 ? rows[0] : null;
        });
};

module.exports.insertUser = (user) => {
    return knex('RVPERSON')
        .insert(
            {

                createdate: new Date(),
                roleid: 2,
                name: user.username,
                univident: user.email,
                pass: bcrypt.hashSync(user.password, 11),
                saldo: 0,
                realname: user.realname
            }
        )
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