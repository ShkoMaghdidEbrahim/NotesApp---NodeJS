const knex = require('knex')(require('../knexfile'));
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
require('dotenv').config();

//Real functions
const registerUser = async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	
	const email = req.body.email;
	const emailVerificationCode = parseInt(req.body.emailVerificationCode);
	
	const phoneNumber = req.body.phoneNumber;
	const phoneVerificationCode = parseInt(req.body.phoneVerificationCode);
	
	const user = await knex('users').where({username: username}).first();
	const emailVerificationCodeToken = await knex('verification_codes').where({sent_to: email}).first();
	const phoneVerificationCodeToken = await knex('verification_codes').where({sent_to: phoneNumber}).first();
	
	let emailVerificationCodeTokenDecoded;
	let phoneVerificationCodeTokenDecoded;
	
	if (emailVerificationCodeToken && phoneVerificationCodeToken) {
		emailVerificationCodeTokenDecoded = jwt.verify(emailVerificationCodeToken.verification_code, process.env.VERIFICATION_SECRET, (err, decoded) => {
			if (err) {
				console.log(err);
				return res.status(401).send({message: "Invalid email verification code"});
			}
			else {
				return decoded;
			}
			
		});
		phoneVerificationCodeTokenDecoded = jwt.verify(phoneVerificationCodeToken.verification_code, process.env.VERIFICATION_SECRET, (err, decoded) => {
			if (err) {
				console.log(err);
				return res.status(401).send({message: "Invalid phone verification code"});
			}
			else {
				return decoded;
			}
		});
	}
	else {
		return res.status(401).send({message: "Verification code not found"});
	}
	
	if (user) {
		res.status(409).send({message: "Username already exists"});
	}
	else if (emailVerificationCodeTokenDecoded.verificationCode !== emailVerificationCode) {
		res.status(401).send({message: "Invalid email verification code"});
	}
	else if (phoneVerificationCodeTokenDecoded.verificationCode !== phoneVerificationCode) {
		res.status(401).send({message: "Invalid phone verification code"});
	}
	else {
		await knex('verification_codes').where({sent_to: email}).del();
		await knex('verification_codes').where({sent_to: phoneNumber}).del();
		const hashedPassword = await bcrypt.hash(password, 10);
		await knex('users').insert({username: username, password: hashedPassword});
		res.status(201).send({message: "User created"});
	}
}

const sendVerificationEmail = async (req, res) => {
	const email = req.body.email;
	
	const transporter = nodemailer.createTransport({
		service: 'gmail', auth: {
			user: process.env.EMAIL_ADDRESS, pass: process.env.EMAIL_PASSWORD
		}
	});
	
	const verificationCode = Math.floor(100000 + Math.random() * 900000);
	
	const mailOptions = {
		from: process.env.EMAIL_TITLE,
		to: req.body.email,
		subject: 'NoteApp Verification Code',
		text: 'Your verification code is: ' + verificationCode + '.' + '\nPlease do not share this code with anyone.' + '\nThis code will expire in 10 minutes.'
	};
	
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error);
			res.status(500).send({message: "Email not sent"});
		}
		else {
			console.log('Email sent: ' + info.response);
			res.status(200).send({message: "Email sent"});
		}
	});
	
	const verificationCodeToken = jwt.sign({verificationCode: verificationCode}, process.env.VERIFICATION_SECRET, {expiresIn: '10m'});
	
	const verificationCodeExists = await knex('verification_codes').where({sent_to: email}).first();
	if (verificationCodeExists) {
		await knex('verification_codes').where({sent_to: email}).update({verification_code: verificationCodeToken});
	}
	else {
		await knex('verification_codes').insert({type: 'email', verification_code: verificationCodeToken, sent_to: email});
	}
}

const sendVerificationPhone = async (req, res) => {
	const phoneNumber = req.body.phoneNumber;
	
	const verificationCode = Math.floor(100000 + Math.random() * 900000);
	
	try {
		await client.messages.create({
			body: 'Your Verification Code Is: ' + verificationCode + '. \nPlease do not share this code with anyone. \nThis code will expire in 10 minutes.',
			from: process.env.TWILIO_PHONE_NUMBER,
			to: '+964' + phoneNumber,
		});
	}
	catch (error) {
		console.error(error);
		res.status(500).send({message: "Phone verification code not sent"});
	}
	const verificationCodeToken = jwt.sign({verificationCode: verificationCode}, process.env.VERIFICATION_SECRET, {expiresIn: '10m'});
	
	const verificationCodeExists = await knex('verification_codes').where({sent_to: phoneNumber}).first();
	if (verificationCodeExists) {
		await knex('verification_codes').where({sent_to: phoneNumber}).update({verification_code: verificationCodeToken});
	}
	else {
		await knex('verification_codes').insert({type: 'phone', verification_code: verificationCodeToken, sent_to: phoneNumber});
	}
	
	res.status(200).send({message: "Phone verification code sent"});
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
	registerUser, loginUser, showAllUsers, refreshTokens, logoutUser, regenerateAccessToken, sendVerificationEmail, sendVerificationPhone
}