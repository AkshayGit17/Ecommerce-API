const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require('../errors');
const {
  createTokenUser,
  attachCookiesToResponse,
  checkPermissions,
} = require('../utils');

const getAllUsers = async (req, res) => {
  const users = await User.find({ role: 'user' }).select('-password');
  res.status(StatusCodes.OK).json({ users, count: users.length });
};
const getSingleUser = async (req, res) => {
  const { id } = req.params;

  // checkPermissions(req.user.userId, id);

  const user = await User.findOne({ _id: id }).select('-password');

  if (!user) {
    throw new NotFoundError(`No user found with id: ${id}`);
  }

  checkPermissions(req.user.userId, user._id);
  res.status(StatusCodes.OK).json({ user });
};
const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};
const updateUser = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    throw new BadRequestError('Please provide all values');
  }

  const user = await User.findOne({ _id: req.user.userId });

  user.name = name;
  user.email = email;

  await user.save();

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};
const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new BadRequestError('Please provide old and new passwords');
  }
  const user = await User.findOne({ _id: req.user.userId });

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid credentials');
  }
  user.password = newPassword;

  await user.save();
  res.status(StatusCodes.OK).json({ msg: 'Success! Password updated' });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};

// const updateUser = async (req, res) => {
//   const { name, email } = req.body;

//   if (!name || !email) {
//     throw new BadRequestError('Please provide all values');
//   }

//   const user = await User.findOneAndUpdate(
//     { _id: req.user.userId },
//     { name, email },
//     { new: true, runValidators: true }
//   );

//   const tokenUser = createTokenUser(user);
//   attachCookiesToResponse({ res, tokenUser });
//   res.status(StatusCodes.OK).json({ user: tokenUser });
// };
