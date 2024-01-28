exports.up = function(knex) {
	return knex.schema.table('notes', table => {
		table.boolean('deleted').defaultTo(0);
	})
};

exports.down = function(knex) {
	return knex.schema.table('notes', table => {
		table.dropColumn('deleted');
	})
};