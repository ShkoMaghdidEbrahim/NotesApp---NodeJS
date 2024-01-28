const knex = require('knex')(require('../knexfile'));
const uuid = require('uuid');
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const storage = multer(multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, 'uploads'));
	}, filename: function (req, file, cb) {
		const randomFilename = `${Date.now()}-${uuid.v4()}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;
		cb(null, randomFilename);
	},
}));

const getNotes = async (req, res) => {
	if (req.params.id === "-1") {
		console.log("ehefasd")
		const notes = await knex('notes').select('*').where('deleted', false);
		res.json(notes);
	}
	else {
		const note = await knex('notes').select('*').where('deleted', false);
		res.json(note);
	}
}

const createNote = async (req, res) => {
	try {
		const {title, content} = req.body;
		let imageUrl = null;
		
		if (req.file) {
			imageUrl = `/uploads/${req.file.filename}`;
		}
		
		await knex('notes').insert({title, content, image_url: imageUrl});
		
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
		const availableIDs = await knex('notes').select('id');
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
		await knex('notes').where('id', req.params.id).update({deleted: true});
		res.json({message: message + 'Note deleted successfully'});
	}
}

const updateNote = async (req, res) => {
	try {
		const {title, content} = req.body;
		let imageUrl = null;
		let message = "";
		
		if (req.file) {
			imageUrl = `/uploads/${req.file.filename}`;
		}
		
		const [note] = await knex('notes').where('id', req.params.id).andWhere('deleted', false);
		if (note && note.image_url !== null) {
			try {
				fs.unlinkSync(path.join(__dirname, note.image_url));
			}
			catch (error) {
				message = "Old file associated with the note could not be found, keep going!"
			}
		}
		
		await knex('notes').where('id', req.params.id).update({title, content, image_url: imageUrl});
		
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