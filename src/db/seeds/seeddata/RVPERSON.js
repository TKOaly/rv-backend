const bcrypt = require('bcrypt');
const user_store = require('../../userStore.js');

module.exports = [{
	userid: 1,
	createdate: new Date('2018-12-24T00:00:00Z'),
	roleid: 2,
	name: 'normal_user',
	univident: 'user@example.com',
	pass: bcrypt.hashSync('hunter2', 11),
	saldo: 500,
	realname: 'John Doe',
}, {
	userid: 2,
	createdate: new Date('2018-12-24T00:00:00Z'),
	roleid: 1,
	name: 'admin_user',
	univident: 'admin@example.com',
	pass: bcrypt.hashSync('admin123', 11),
	saldo: 500,
	realname: 'BOFH',
	rfid: bcrypt.hashSync('1234', user_store.RFID_SALT),
}, {
	userid: 3,
	createdate: new Date('2024-02-20T00:00:00Z'),
	roleid: 3,
	name: 'user_2',
	univident: 'user2@example.com',
	pass: bcrypt.hashSync('role2', 11),
	saldo: -500,
	realname: 'User Two',
}, {
	userid: 4,
	createdate: new Date('2022-02-20T00:00:00Z'),
	roleid: 7,
	name: 'user_inactive',
	univident: 'inactive@example.com',
	pass: bcrypt.hashSync('inactive', 11),
	saldo: -1100,
	realname: 'Inactive User',
}];
