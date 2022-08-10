
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const userModel = require('../models/authModel');
const { errorWrapper } = require("../utils/errorWrapper")
const { MainErrorHandler } = require("../utils/MainErrorHandler")
const { JWT_SERCTET } = process.env;


exports.protected = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      throw new MainErrorHandler('you are not logged in ', 401)
    }

    const decoded = await promisify(jwt.verify)(token, JWT_SERCTET);

    const foundedUser = await userModel.findById(decoded.id);

    if (!foundedUser) {
      throw new MainErrorHandler('user no longer exist ', 401)
    }
    if (foundedUser.changePasswordAfter(decoded.iat)) {
      throw new MainErrorHandler('User recently changed password! Please log in again.', 401)
    }

    req.user = foundedUser;
    next();
  } catch (err) {
    const formattedError = errorWrapper(err)
    return res.status(401).json(formattedError.getFormattedResponse())
  }
}

exports.restrictTo = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!roles.includes(req.user.role)) {
        return next(
          new MainErrorHandler('you did not have permission of this route', 401)
        );
      }
      next();
    } catch (err) {
      const formattedError = errorWrapper(err)
      return res.status(401).json(formattedError.getFormattedResponse())
    }
  }
};
