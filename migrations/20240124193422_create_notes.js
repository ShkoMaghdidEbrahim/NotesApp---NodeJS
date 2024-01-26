exports.up = function (knex) {
    return knex.schema.createTable('notes', function (table) {
        table.increments('id').primary();
        table.string('title').defaultTo("");
        table.text('content').defaultTo("");
        table.string('image_url');
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('notes');
};
