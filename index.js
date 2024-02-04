const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const LAN_IP = 'localhost';
const cors = require("cors");

const cookieParser = require('cookie-parser');

const corsOptions = {
	origin: true, //included origin as true
	credentials: true, //included credentials as true
};

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(cors(corsOptions));
const path = require("path");

app.use(express.static(path.join(__dirname, 'Views')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'views', 'index.html'));
	res.sendFile(path.join(__dirname, 'views', 'UserLogin.html'));
	res.sendFile(path.join(__dirname, 'views', 'UserRegistration.html'));
});

const usersRoutes = require('../note-app/Routes/UserRoutes');
app.use('/users', usersRoutes);

const notesRoutes = require('../note-app/Routes/NotesRoutes');

app.use(notesRoutes);

app.listen(PORT, LAN_IP, () => {
	console.log(`Server is running on http://${LAN_IP}:${PORT}`);
});
