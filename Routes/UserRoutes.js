const express = require('express');
const cors = require('cors');
const app = express();
const router = express.Router();

const usersController = require('../Controllers/UsersController');

app.use(router);

router.route('/login').post(usersController.loginUser)

router.route('/register').post(usersController.registerUser)

router.route('/users').get(usersController.showAllUsers)

module.exports = router;
