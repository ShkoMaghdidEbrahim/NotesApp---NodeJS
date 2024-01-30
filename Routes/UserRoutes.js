const express = require('express');
const cors = require('cors');
const app = express();
const router = express.Router();

const usersController = require('../Controllers/UsersController');

app.use(router);
router.use(cors());

//Real routes
router.route('/register').post(usersController.registerUser);

router.route('/login').post(usersController.loginUser);

router.route('/logout').post(usersController.logoutUser);

router.route('/regenerate_access_token').post(usersController.regenerateAccessToken);

//For testing purposes
router.route('/').get(usersController.showAllUsers);

router.route('/refresh_tokens').get(usersController.refreshTokens);

module.exports = router;
