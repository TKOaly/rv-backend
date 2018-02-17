exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('user_roles', table => {
        table
            .string('user')
            .references('username')
            .inTable('users');
        table
            .string('role')
            .references('role_name')
            .inTable('roles');
        table.unique(['user', 'role']);
    });
};

exports.down = function(knex, Promise) {
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('user_roles');
    }
};
