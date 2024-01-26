const express = require('express');
const cors = require('cors');
const app = express();
const multer = require('multer');
const path = require("path");
const fs = require("fs");
const PORT = process.env.PORT || 3000;
const knex = require('knex')(require('./knexfile'));
const uuid = require('uuid');

app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, 'uploads'));
	}, filename: function (req, file, cb) {
		const randomFilename = `${Date.now()}-${uuid.v4()}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;
		cb(null, randomFilename);
	},
});

const upload = multer({storage});

app.get('/notes/:id', async (req, res) => {
	if (req.params.id === "-1") {
		console.log("were here")
		const notes = await knex('notes').select('*');
		res.json(notes);
	}
	else {
		const note = await knex('notes').select('*').where('id', req.params.id);
		res.json(note);
	}
	
});

app.post('/notes', upload.single('image'), async (req, res) => {
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
});

app.delete('/notes/:id', async (req, res) => {
	let message = "";
	if (req.params.id === "-1") {
		const availableIDs = await knex('notes').select('id');
		const ids = availableIDs.map(note => note.id);
		
		if (ids.length > 0) {
			for (const id of ids) {
				const [note] = await knex('notes').where('id', id);
				if (note && note.image_url !== null) {
					try {
						fs.unlinkSync(path.join(__dirname, note.image_url));
					}
					catch (error) {
						message = "Old file associated with the note could not be found, keep going!"
					}
				}
				await knex('notes').where('id', id).del();
			}
			res.json({message: message + 'All notes deleted successfully'});
		}
		else {
			res.json({message: 'Notes list is empty!'});
		}
		
	}
	else {
		const [note] = await knex('notes').where('id', req.params.id);
		if (note && note.image_url !== null) {
			try {
				fs.unlinkSync(path.join(__dirname, note.image_url));
			}
			catch (error) {
				message = "Old file associated with the note could not be found, keep going!"
			}
		}
		
		await knex('notes').where('id', req.params.id).del();
		res.json({message: message + 'Note deleted successfully'});
	}
	
});

app.put('/notes/:id', upload.single('image'), async (req, res) => {
	try {
		const {title, content} = req.body;
		let imageUrl = null;
		let message = "";
		
		if (req.file) {
			imageUrl = `/uploads/${req.file.filename}`;
		}
		
		const [note] = await knex('notes').where('id', req.params.id);
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
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
