var bcrypt = require('bcrypt');

exports.seed = function(knex, Promise) {
    return knex('SALDOHISTORY').del()
        .then(() => {
            return knex('RVPERSON').del();
        })
        .then(() => {
            return knex('ROLE').del();
        })
        .then(() => {
            return knex('ROLE').insert([
                {
                    role: 'ADMIN',
                    buzzerlimit: -1000,
                    fgcolor: 37,
                    bgcolor: 40
                },
                {
                    role: 'USER1',
                    buzzerlimit: -1000,
                    fgcolor: 37,
                    bgcolor: 40
                },
                {
                    role: 'USER2',
                    buzzerlimit: -1000,
                    fgcolor: 31,
                    bgcolor: 47
                },
                {
                    role: 'USER3',
                    buzzerlimit: -5000,
                    fgcolor: 32,
                    bgcolor: 40
                },
                {
                    role: 'USER4',
                    buzzerlimit: -1000,
                    fgcolor: 37,
                    bgcolor: 40
                },
                {
                    role: 'MULKKU',
                    buzzerlimit: -1000,
                    fgcolor: 37,
                    bgcolor: 40
                },
                {
                    role: 'INACTIVE',
                    buzzerlimit: -1000,
                    fgcolor: 37,
                    bgcolor: 40
                }
            ]);
        })
        .then(() => {
            return knex('RVPERSON').insert([
                {
                    createdate: new Date(),
                    roleid: 2,
                    name: 'normal_user',
                    univident: 'user@example.com',
                    pass: bcrypt.hashSync('hunter2', 11),
                    saldo: 500,
                    realname: 'John Doe'
                },
                {   
                    createdate: new Date(),
                    roleid: 1,
                    name: 'admin_user',
                    univident: 'admin@example.com',
                    pass: bcrypt.hashSync('admin123', 11),
                    saldo: 500,
                    realname: 'BOFH'
                }
            ]);
        });
};
