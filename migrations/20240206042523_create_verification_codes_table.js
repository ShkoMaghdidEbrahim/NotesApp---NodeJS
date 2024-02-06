exports.up = function(knex) {
	return knex.schema.createTable('verification_codes', function(table) {
		table.increments('id').primary();
		table.string('type').notNullable();
		table.string('verification_code').notNullable();
		table.string('sent_to').notNullable();
		table.timestamps(true, true);
	});
};

exports.down = function(knex) {
	return knex.schema.dropTable('verification_codes');
};