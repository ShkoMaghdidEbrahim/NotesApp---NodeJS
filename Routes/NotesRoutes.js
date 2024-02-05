const express = require('express');
const app = express();
const router = express.Router();
const notesController = require('../Controllers/NotesController');
const userInteractionsController = require("../Controllers/UserInteractionsController");
const authenticateToken = require('../Controllers/AuthenticateToken');
app.use(router);

const upload = notesController.storage;

router.use(authenticateToken.authenticateToken);

router.route('/').
	   post(upload.single('image'), notesController.createNote);

router.route('/:id').
	   get(notesController.getNotes).
	   delete(notesController.deleteNotes).
	   put(upload.single('image'), notesController.updateNote);

router.route('/:id/like').post(userInteractionsController.likeNote);

router.route('/:id/comment').post(userInteractionsController.commentNote);

module.exports = router;
