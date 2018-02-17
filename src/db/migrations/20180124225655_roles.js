exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('roles', function(table) {
        table
            .string('role_name', 50)
            .primary()
            .index('role_name_index');
        table.string('role_description', 200);
    });
};

exports.down = function(knex, Promise) {
    if (process.env.NODE_ENV !== 'production') {
        return knex.schema.dropTableIfExists('roles');
    }
};
