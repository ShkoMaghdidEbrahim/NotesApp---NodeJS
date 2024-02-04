const knex = require('knex')(require('../knexfile'));
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

//Real functions
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
		const token = jwt.sign({username: authenticatedUser.username}, process.env.JWT_ACCESS_SECRET, {expiresIn: '60m'});
		const refreshToken = jwt.sign({username: authenticatedUser.username}, process.env.JWT_REFRESH_SECRET, {expiresIn: '7d'});
		
		const user_id = await knex('users').where({username: username}).first();
		
		await knex('refresh_tokens').where({user_id: user_id.id}).del();
		await knex('refresh_tokens').insert({token: refreshToken, user_id: user_id.id});
		
		res.cookie('token', token, {httpOnly: true, maxAge: 60 * 60 * 1000});
		res.cookie('refreshToken', refreshToken, {httpOnly: true, maxAge: 60 * 60 * 24 * 7 * 1000});
		res.cookie('username', username, {httpOnly: true, maxAge: 60 * 60 * 1000});
		res.cookie('authenticated', true, {httpOnly: false, maxAge: 60 * 60 * 1000});
		
		res.status(200).send({message: "Authentication successful"});
	}
	else {
		res.status(401).send({message: "Authentication failed"});
	}
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

const logoutUser = async (req, res) => {
	try {
		const user_id = await knex('users').where({username: req.cookies.username}).first();
		await knex('refresh_tokens').where({user_id: user_id.id}).del();
		res.clearCookie('token');
		res.clearCookie('refreshToken');
		res.clearCookie('username');
		res.clearCookie('authenticated');
		res.json({message: 'Logged out successfully'});
	}
	catch (error) {
		console.error(error);
	}
	
}

const regenerateAccessToken = async (req, res) => {
	console.log(req.cookies);
	const refreshToken = req.cookies.refreshToken;
	
	if (!refreshToken) {
		res.status(401).send({message: 'No refresh token provided'});
	}
	else {
		const user_id = await knex('users').where({username: req.cookies.username}).first();
		const token = await knex('refresh_tokens').where({token: refreshToken, user_id: user_id.id}).first();
		
		if (!token) {
			res.status(401).send({message: 'Invalid refresh token'});
		}
		else {
			const accessToken = jwt.sign({username: req.cookies.username}, process.env.JWT_ACCESS_SECRET, {expiresIn: '60m'});
			res.cookie('token', accessToken, {httpOnly: true});
			res.status(200).send({message: 'Access token regenerated'});
		}
	}
}

//For testing purposes
const showAllUsers = async (req, res) => {
	const users = await knex('users').select('*');
	res.status(200).send(users).send({message: "Users retrieved"});
}

const refreshTokens = async (req, res) => {
	const tokens = await knex('refresh_tokens').select('*');
	res.json(tokens);
}

module.exports = {
	registerUser, loginUser, showAllUsers, refreshTokens, logoutUser, regenerateAccessToken
}