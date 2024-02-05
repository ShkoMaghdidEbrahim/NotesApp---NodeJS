exports.up = function (knex) {
	return knex.schema.createTable('comments', function (table) {
		table.increments('id').primary();
		table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
		table.integer('post_id').unsigned().references('id').inTable('notes').onDelete('CASCADE');
		table.string('username').notNullable();
		table.text('content').notNullable();
		table.timestamps(true, true);
	});
};

exports.down = function (knex) {
	return knex.schema.dropTableIfExists('comments');
};
