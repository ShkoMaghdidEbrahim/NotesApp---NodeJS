const knex = require('knex')(require('../knexfile'));
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = async (req, res, next) => {
	if (req.path === '/refresh_tokens') {
		return next();
	}
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];
	if (token == null) {
		return res.status(401).send({message: "No Token Provided."});
	}
	jwt.verify(token, process.env.JWT_ACCESS_SECRET, async (err, user) => {
		if (err) {
			return res.status(403).send({message: "Invalid token"});
		}
		const userExists = await knex('users').where({username: user.username}).first();
		if (!userExists) {
			return res.status(403).send({message: "Invalid token"});
		}
		req.user = user;
		next();
	});
}

module.exports = {
	authenticateToken
}