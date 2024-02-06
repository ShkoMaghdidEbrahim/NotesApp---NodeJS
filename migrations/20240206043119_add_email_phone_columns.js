exports.up = function (knex) {
	return knex.schema.table('notes', table => {
		table.string('email').notNullable();
		table.string('phone').notNullable();
	})
};

exports.down = function (knex) {
	return knex.schema.table('notes', table => {
		table.dropColumn('public');
	})
};