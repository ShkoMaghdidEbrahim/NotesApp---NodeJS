exports.up = function (knex) {
	return knex.schema.table('notes', table => {
		table.boolean('public').defaultTo(0);
	})
};

exports.down = function (knex) {
	return knex.schema.table('notes', table => {
		table.dropColumn('public');
	})
};