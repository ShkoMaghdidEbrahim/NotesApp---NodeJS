const knex = require('knex')(require('../knexfile'));
require('dotenv').config();

//Real functions
const likeNote = async (req, res) => {
	try {
		const item_id = req.params.id;
		const user_id = Object.values(await knex('users').select('id').where('username', req.user.username).first())[0];
		const note = await knex('notes').where('id', item_id).andWhere('deleted', false).first();
		if (!note) {
			return res.status(404).send({message: 'Note not found'});
		}
		const like = await knex('likes').where('item_id', item_id).andWhere('user_id', user_id).first();
		if (like) {
			await knex('likes').where({user_id, item_id}).del();
			return res.status(200).send({message: 'Note unliked'});
		}
		await knex('likes').insert({user_id, item_id});
		return res.status(200).send({message: 'Note liked'});
	}
	catch (error) {
		console.error(error);
	}
}

const commentNote = async (req, res) => {
	try {
		const post_id = req.params.id;
		const content = req.body.comment;
		const username = req.user.username;
		const note = await knex('notes').where('id', post_id).andWhere('deleted', false).first();
		if (!note) {
			return res.status(404).json({message: 'Note not found'});
		}
		const user_id = Object.values(await knex('users').select('id').where('username', req.user.username).first())[0];
		console.log(user_id, post_id, content);
		await knex('comments').insert({user_id, post_id, username, content});
		return res.status(200).json({message: 'Comment added'});
	}
	catch (error) {
		console.error(error);
	}
}

module.exports = {
	likeNote, commentNote
}