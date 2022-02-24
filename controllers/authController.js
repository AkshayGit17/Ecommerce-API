const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const { BadRequestError } = require('../errors');
const { createJWT } = require('../utils');

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const emailAlreadyExists = await User.findOne({ email });

  if (emailAlreadyExists) {
    throw new BadRequestError('Email already exists');
  }

  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? 'admin' : 'user';

  const user = await User.create({ name, email, password, role });

  const tokenUser = { name: user.name, id: user._id, role: user.role };

  const token = createJWT({ payload: tokenUser });

  res.status(StatusCodes.CREATED).json({ user: tokenUser, token });
};
const login = async (req, res) => {
  res.send('login');
};
const logout = async (req, res) => {
  res.send('logout');
};

module.exports = { register, login, logout };
