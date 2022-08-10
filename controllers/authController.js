const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const userModel = require("../models/authModel");
const { templatedMailSender } = require("../utils/mailSender")
const { profilepic } = require("../utils/s3Helpers");
const { MainErrorHandler } = require("../utils/MainErrorHandler");
const { errorWrapper } = require("../utils/errorWrapper")
const {
  verifyRequiredFieldsHelper,
  checkExtraFields
} = require("../utils/fieldOperations");

const {
  JWT_SERCTET,
  JWT_EXPIRE_IN,
  BASE_LINK_FORGET_EMAIL,
} = process.env;

const signToken = (id) => {
  const token = jwt.sign({ id }, JWT_SERCTET, {
    expiresIn: JWT_EXPIRE_IN,
  });
  return token;
};

const singup = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
    } = req.body;

    checkExtraFields(
      req.body,
      ["first_name", "last_name", "email", "zip_code", "address", "password"]
    );
    verifyRequiredFieldsHelper([
      { type: 'String', name: "first_name", value: first_name },
      { type: 'String', name: "last_name", value: last_name },
      { type: 'String', name: "email", value: email },
      { type: 'String', name: "zip_code", value: zip_code },
      { type: 'String', name: "address", value: address },
      { type: 'String', name: "password", value: password },
    ]);

    const userExist = await userModel.findOne({ email });
    if (userExist) {
      throw new MainErrorHandler("This user already exists", 412)
    }
    const newUser = await userModel.create({
      first_name,
      last_name,
      email,
      password,
    });
    const token = signToken(newUser._id);

    res.status(201).json({
      success: true,
      msg: "User Registered successfully",
      data: {
        token,
        user: newUser,
      },
    });
  } catch (err) {
    const handledError = errorWrapper(err)
    return res.status(handledError.errorCode).json(handledError.getFormattedResponse())
  }
}

const login = async (req, res, next) => {
  try {
    const { password, email } = req.body;

    checkExtraFields(
      req.body,
      ["email", "password"]
    );
    verifyRequiredFieldsHelper([
      { type: 'String', name: "email", value: email },
      { type: 'String', name: "password", value: password },
    ]);

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      throw new MainErrorHandler("This email is not registered!", 412);
    }
    const correct = await user.correctPassword(password, user.password);
    if (!correct) {
      throw new MainErrorHandler("Incorrect password!", 412);
    }
    const token = signToken(user._id);
    res.status(200).json({
      success: true,
      data: {
        token,
        user,
      },
    });
  } catch (err) {
    const handledError = errorWrapper(err)
    return res.status(handledError.errorCode).json(handledError.getFormattedResponse())
  }
}

const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    checkExtraFields(
      req.body,
      ["email",]
    );
    verifyRequiredFieldsHelper([
      { type: 'String', name: "email", value: email },
    ]);

    if (user?.is_google_login) {
      throw new MainErrorHandler("No such user exists!", 412);
    }
    if (!user) {
      throw new MainErrorHandler("This Link is no more long er vilad!", 412)
    }
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetURL = BASE_LINK_FORGET_EMAIL + "/" + resetToken;
    const data = { link: resetURL };

    templatedMailSender(email, "./forgotPassword.ejs", data, "Forgot password")
    return res.status(200).json({
      success: true,
      msg: "reset password link sent successfully",
    });
  } catch (err) {
    const handledError = errorWrapper(err)
    return res.status(handledError.errorCode).json(handledError.getFormattedResponse())
  }
}

const restPassword = async (req, res, next) => {
  try {
    const token = req.params.token;
    const { newpassword } = req.body;

    checkExtraFields(
      req.body,
      ["newpassword"]
    );
    verifyRequiredFieldsHelper([
      { type: 'String', name: "newpassword", value: newpassword },
      { type: 'String', name: "token", value: token },
    ]);

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await userModel.findOne({
      password_reset_token: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      throw new MainErrorHandler("Reset password link is expired", 412);
    }
    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;
    user.password_reset_token = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    const jwttoken = signToken(user._id);
    return res.status(200).json({
      success: true,
      data: { token: jwttoken, },
      msg: "password change successfully",
    });
  } catch (err) {
    const handledError = errorWrapper(err)
    return res.status(handledError.errorCode).json(handledError.getFormattedResponse())
  }
}

const updatePassword = async (req, res, next) => {
  try {
    const focusedUserId = req.user._id;
    const { oldPassword, newPassword, newPasswordConfirm } = req.body;

    checkExtraFields(
      req.body,
      ["oldPassword", "newPassword", "newPasswordConfirm"]
    );
    verifyRequiredFieldsHelper([
      { type: 'String', name: "oldPassword", value: oldPassword },
      { type: 'String', name: "newPassword", value: newPassword },
      { type: 'String', name: "newPasswordConfirm", value: newPasswordConfirm },
    ]);
    const user = await userModel.findById(focusedUserId).select("+password");
    if (!user) {
      throw new MainErrorHandler("No such user exists!")
    }
    const correct = await user.correctPassword(oldPassword, user.password);
    if (!correct) {
      throw new MainErrorHandler("The old password provieded is incorrect!", 412)
    }
    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;
    await user.save();
    const jwttoken = signToken(user._id);
    return res.status(200).json({
      success: true,
      token: jwttoken,
      msg: "password change successfully",
    });
  } catch (err) {
    const handledError = errorWrapper(err)
    return res.status(handledError.errorCode).json(handledError.getFormattedResponse())
  }
}

const updateUserData = async (req, res, next) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const focusedUserId = req.user._id;

    checkExtraFields(
      req.body,
      ["first_name", "last_name", "phone"]
    );
    verifyRequiredFieldsHelper([
      { type: 'String', name: "focusedUserId", value: focusedUserId.toString() },
      { type: 'String', name: "first_name", value: first_name },
      { type: 'String', name: "last_name", value: last_name },
      { type: 'String', name: "phone", value: email },
    ]);

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      { first_name, last_name, phone },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      throw new MainErrorHandler("No such user exists!", 412)
    }

    return res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
      msg: "Profile updated successfully",
    });
  } catch (err) {
    const handledError = errorWrapper(err)
    return res.status(handledError.errorCode).json(handledError.getFormattedResponse())
  }
}

const uploadProfle = async (req, res, next) => {
  try {
    let token;
    const result = await profilepic(req.file);
    if (!result) {
      throw new MainErrorHandler("Something went wrong while uploading image", 500)
    }

    token = req.headers.authorization.split(" ")[1];
    const decoded = await promisify(jwt.verify)(token, JWT_SERCTET);

    if (result) {
      const updatedUser = await userModel.findByIdAndUpdate(
        decoded.id,
        { avatar: result.imageUrl },
        { new: true }
      );
      if (!updatedUser) {
        return MainErrorHandler("User did not found", 400)
      }
      return res.status(200).json({
        success: true,
        msg: "Image uploaded successfully",
        data: { user: updatedUser },
      });
    } else {
      throw new MainErrorHandler("Image not found", 400);
    }
  } catch (err) {
    const handledError = errorWrapper(err)
    return res.status(handledError.errorCode).json(handledError.getFormattedResponse())
  }
}
/*
  This route is use to set passsword of the users who join some admin 
  as his/her teeam members
*/
const setUserPassword = async (req, res, next) => {
  try {
    const { password, token } = req.body;

    checkExtraFields(
      req.body,
      ["password", "token",]
    );
    verifyRequiredFieldsHelper([
      { type: 'String', name: "password", value: password },
      { type: 'String', name: "token", value: token },
    ]);

    const decoded = jwt.verify(token, JWT_SERCTET);
    if (decoded.id) {
      const foundedUser = await userModel.findOne({ _id: decoded.id });
      if (!foundedUser) {
        throw new MainErrorHandler("No such user exists invalid token", 412);
      }
      if (foundedUser.usedLink == true) {
        throw new MainErrorHandler("This link is already used");
      }
      foundedUser.password = password;
      foundedUser.usedLink = true;
      await foundedUser.save();
    }
    return res.status(200).json({
      success: true,
      msg: "Password reset successfully!",
    });
  } catch (err) {
    const handledError = errorWrapper(err)
    return res.status(handledError.errorCode).json(handledError.getFormattedResponse())
  }
};

module.exports = {
  singup,
  login,
  forgetPassword,
  restPassword,
  updatePassword,
  updateUserData,
  uploadProfle,
  setUserPassword,
};
