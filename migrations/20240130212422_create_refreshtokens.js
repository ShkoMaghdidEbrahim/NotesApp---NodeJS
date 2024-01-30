// migrations/20240131000000_create_refreshtokens_table.js

exports.up = function (knex) {
	return knex.schema.createTable('refresh_tokens', function (table) {
		table.increments('id').primary();
		table.string('token').notNullable();
		table.integer('user_id').unsigned().notNullable().references('id').inTable('users');
		table.timestamps(true, true); // Adds created_at and updated_at columns
	});
};

exports.down = function (knex) {
	return knex.schema.dropTable('refresh_tokens');
};
