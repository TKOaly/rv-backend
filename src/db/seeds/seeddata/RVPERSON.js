const bcrypt = require('bcrypt');

module.exports = [
    {
        userid: 1,
        createdate: new Date('2018-12-24T00:00:00Z'),
        roleid: 2,
        name: 'normal_user',
        univident: 'user@example.com',
        pass: bcrypt.hashSync('hunter2', 11),
        saldo: 500,
        realname: 'John Doe'
    },
    {
        userid: 2,
        createdate: new Date('2018-12-24T00:00:00Z'),
        roleid: 1,
        name: 'admin_user',
        univident: 'admin@example.com',
        pass: bcrypt.hashSync('admin123', 11),
        saldo: 500,
        realname: 'BOFH'
    }
];
