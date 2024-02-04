exports.up = function (knex) {
	return knex.schema.createTable('likes', function (table) {
		table.increments('id').primary();
		table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
		table.integer('item_id').unsigned().references('id').inTable('notes').onDelete('CASCADE');
		table.timestamps(true, true);
	});
};

exports.down = function (knex) {
	return knex.schema.dropTableIfExists('likes');
};
