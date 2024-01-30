exports.up = function(knex) {
	return knex.schema.table('notes', table => {
		table.string('username').notNullable();
	})
};

exports.down = function(knex) {
	return knex.schema.table('notes', table => {
		table.dropColumn('username');
	})
};