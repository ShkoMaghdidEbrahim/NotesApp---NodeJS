const express = require('express');
const app = express();
const router = express.Router();

const notesController = require('../Controllers/NotesController');

app.use(router);

const upload = notesController.storage;

const authenticateToken = require('../Controllers/AuthenticateToken');
router.use(authenticateToken.authenticateToken);

router.route('/notes').
	   post(upload.single('image'), notesController.createNote);

router.route('/notes/:id').
	   get(notesController.getNotes).
	   delete(notesController.deleteNotes).
	   put(upload.single('image'), notesController.updateNote);

module.exports = router;
