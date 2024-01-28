const knex = require('knex')(require('../knexfile'));
const fs = require("fs");
const bcrypt = require('bcrypt');

const registerUser = async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	
	const user = await knex('users').where({username: username}).first();
	if (user) {
		res.status(409).send({message: "Username already exists"});
	}
	else {
		const hashedPassword = await bcrypt.hash(password, 10);
		await knex('users').insert({username: username, password: hashedPassword});
		res.status(201).send({message: "User created"});
	}
}

const loginUser = async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	
	const authenticatedUser = await authenticateUser(username, password);
	
	if (authenticatedUser) {
		res.status(200).send({message: "Authentication successful"});
	}
	else {
		res.status(401).send({message: "Authentication failed"});
	}
}

const showAllUsers = async (req, res) => {
	const users = await knex('users').select('*');
	res.status(200).send(users);
}

async function authenticateUser(username, password) {
	try {
		const user = await knex('users').where({username}).first();
		
		if (!user) {
			return null;
		}
		
		const passwordMatch = await bcrypt.compare(password, user.password);
		return passwordMatch ? user : null;
	}
	catch (error) {
		console.error('Error during authentication:', error);
		throw error;
	}
}

module.exports = {
	registerUser,
	loginUser,
	showAllUsers
}