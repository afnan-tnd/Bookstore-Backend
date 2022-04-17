const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { promisify } = require('util');
const User = require('../models/authModel');

const { JWT_SERCTET } = process.env;

const jwt = require('jsonwebtoken');

exports.protected = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('you are not logged in ', 401));
  }

  const decoded = await promisify(jwt.verify)(token, JWT_SERCTET);

  const freshUser = await User.findById(decoded.id);

  if (!freshUser) return next(new AppError('user no longer exist ', 401));
  if (freshUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you did not have permission of this route', 401)
      );
    }
    next();
  });
};
