const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors");

app.use(express.json());
app.use(cors());

const usersRoutes = require('../note-app/Routes/UserRoutes');
app.use('/users', usersRoutes);

const notesRoutes = require('../note-app/Routes/NotesRoutes');
app.use(notesRoutes);

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
