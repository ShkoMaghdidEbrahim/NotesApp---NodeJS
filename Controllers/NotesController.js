const knex = require('knex')(require('../knexfile'));
const uuid = require('uuid');
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const storage = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, path.join(__dirname, '..', 'uploads'));
		}, filename: function (req, file, cb) {
			const randomFilename = `${Date.now()}-${uuid.v4()}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;
			cb(null, randomFilename);
		},
	})
});

const getNotes = async (req, res) => {
	const user = req.user;
	let response = {};
	
	if (req.params.id === "-1") {
		const userNotes = await knex('notes').
			select('*').
			where('username', user.username).
			andWhere('deleted', false);
		
		for (const userNote of userNotes) {
			userNote.comments = await knex('comments').
				select('*').
				where('post_id', userNote.id);
			userNote.numberOfLikes = (await knex('likes').
				where('item_id', userNote.id).
				count('user_id', {as: 'likes'}))[0].likes || 0;
			userNote.liked = !!(await knex('likes').
				where('item_id', userNote.id).
				first());
		}
		
		const publicNotes = await knex('notes').select('*').where('public', true).andWhereNot('username', user.username).andWhere('deleted', false);
		
		for (const publicNote of publicNotes) {
			publicNote.comments = await knex('comments').
				select('*').
				where('post_id', publicNote.id);
			publicNote.numberOfLikes = (await knex('likes').
				where('item_id', publicNote.id).
				count('user_id', {as: 'likes'}))[0].likes || 0;
			publicNote.liked = !!(await knex('likes').
				where('item_id', publicNote.id).
				first());
		}
		
		response = {userNotes, publicNotes};
	}
	else {
		const singleNote = await knex('notes').
			select('*').where('public', true).
			andWhere('id', req.params.id).
			andWhere('deleted', false).
			first();
		
		if (!singleNote) {
			return res.status(404).json({message: 'Note not found'});
		}
		
		singleNote.comments = await knex('comments').
			select('*').
			where('post_id', req.params.id);
		singleNote.numberOfLikes = (await knex('likes').
			where('item_id', req.params.id).
			count('user_id', {as: 'likes'}))[0].likes || 0;
		singleNote.liked = !!(await knex('likes').
			where('item_id', req.params.id).
			first());
		
		response = singleNote;
	}
	
	console.log(response);
	return res.json(response);
};

const createNote = async (req, res) => {
	try {
		const {title, content} = req.body;
		let imageUrl = null;
		const user = req.user;
		
		if (req.file) {
			imageUrl = `/uploads/${req.file.filename}`;
		}
		await knex('notes').insert({title, content, image_url: imageUrl, username: user.username, public: JSON.parse(req.body.public)});
		
		res.status(201).json({message: 'Note created successfully'});
	}
	catch (error) {
		console.error(error);
		res.status(500).json({error: 'Internal Server Error'});
	}
}

const deleteNotes = async (req, res) => {
	let message = "";
	if (req.params.id === "-1") {
		const availableIDs = await knex('notes').select('id').where('deleted', false).andWhere('username', req.user.username);
		const ids = availableIDs.map(note => note.id);
		
		if (ids.length > 0) {
			for (const id of ids) {
				await knex('notes').where('id', id).update({deleted: true});
			}
			res.json({message: message + 'All notes deleted successfully'});
		}
		else {
			res.json({message: 'Notes list is empty!'});
		}
		
	}
	else {
		await knex('notes').where('id', req.params.id).andWhere('username', req.user.username).update({deleted: true});
		res.json({message: message + 'Note deleted successfully'});
	}
}

const updateNote = async (req, res) => {
	try {
		const {title, content} = req.body;
		let message = "";
		
		if (req.file) {
			const imageUrl = `/uploads/${req.file.filename}`;
			
			const [note] = await knex('notes').where('id', req.params.id).andWhere('deleted', false);
			if (note && note.image_url !== null) {
				try {
					fs.unlinkSync(path.join(__dirname, note.image_url));
				}
				catch (error) {
					message = "Old file associated with the note could not be found, keep going!"
				}
			}
			
			await knex('notes').where('id', req.params.id).update({title, content, image_url: imageUrl, public: JSON.parse(req.body.public)});
		}
		
		await knex('notes').where('id', req.params.id).update({title, content, public: JSON.parse(req.body.public)});
		res.json({message: message + 'Note updated successfully'});
	}
	catch (error) {
		console.error(error);
		res.status(500).json({error: 'Internal Server Error'});
	}
}

module.exports = {
	getNotes, createNote, deleteNotes, updateNote, storage
}