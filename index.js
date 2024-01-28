const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors");

app.use(express.json());
app.use(cors());

const notesRoutes = require('../note-app/Routes/NotesRoutes');
app.use(notesRoutes);

const usersRoutes = require('../note-app/Routes/UserRoutes');
app.use(usersRoutes);

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
