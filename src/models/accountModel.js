// IGNORE ME

function Account(account) {
    return {
        username: account.username,
        password: account.password,
        realname: account.realname,
        email: account.email
    };
}

const validate = (account) => {
    return false;
};

module.export = validate;
