const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const userModel = require("../models/authModel");
//const AppError = require("../utils/appError");
const { templatedMailSender } = require("../utils/mailSender")
const { profilepic } = require("../utils/uploadProfile");
const { ApiError } = require("../utils/apiError");
const res = require("express/lib/response");

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
    const { firstName, lastName, email, password } = req.body;
    const userExist = await userModel.findOne({ email });
    if (userExist) {
      throw new ApiError("This user already exists", 412)
    }
    const newUser = await userModel.create({
      firstName,
      lastName,
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
    return res.status(err.code).json(err.getFormattedResponse())
  }
}

const singupGoogle = async (payload) => {
  try {
    const { firstName, lastName, email, googleId, avator } = payload;
    const userExist = await userModel.findOne({ email });
    if (userExist)
      throw new ApiError("user already exist with this email", 412);
    const newUser = await userModel.create({
      firstName,
      lastName,
      email,
      password: googleId,
      avator,
      isGoogleLogin: true,
    });
    const token = signToken(newUser._id);

    const reuslt = {
      success: true,
      msg: "User Registered successfully",
      data: {
        token,
        user: newUser,
      },
    };
    return reuslt;
  } catch (err) {
    return res.status(err.code).json(err.getFormattedResponse())
  }
};

const loginwithgoogle = async (req, res, next) => {
  try {
    const { email, googleId } = req.body;
    if (!email) {
      throw new ApiError("email is required API call parameter!", 412)
    }

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      // user dotes not exit with this email it mean we have to create new user

      const userdata = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        googleId: req.body.googleId,
        avator: req.body.avatar,
      };
      const userResult = await singupGoogle(userdata);
      return res.status(200).json(userResult);
    }
    if (!user?.isGoogleLogin) {
      throw new ApiError("User already exits with the email provided!", 412)
    }
    const correct = await user.correctPassword(googleId, user.password);
    if (!correct) {
      throw new ApiError("Incorrect email or password provided!", 412)
    }
    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      data: {
        token,
        user,
      },
    })
  } catch (err) {
    return res.status(err.code).json(err.getFormattedResponse())
  }
}

const login = async (req, res, next) => {
  try {
    const { password, email } = req.body;
    if (!password || !email) {
      throw new ApiError("email and password is required", 412);
    }
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError("Incorrect email!", 412);
    }
    const correct = await user.correctPassword(password, user.password);
    if (!correct) {
      throw new ApiError("Incorrect  password!", 412);
    }

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user,
      },
    });
  } catch (err) {
    return res.status(err.code).json(err.getFormattedResponse())
  }
}

const forgetPassword = async (req, res, next) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });
    if (user?.isGoogleLogin) {
      throw new ApiError("No such user exists!", 412);
    }
    if (!user) {
      throw new ApiError("This Link is no more long er vilad!", 412)
    }
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetURL = BASE_LINK_FORGET_EMAIL + "/" + resetToken;
    const data = { link: resetURL };
    const { email } = user;
    templatedMailSender(email, "./forgotPassword.ejs", data, "Forgot password")
    return res.status(200).json({
      success: true,
      msg: "reset password link sent successfully",
    });
  } catch (err) {
    return res.status(err.code).json(err.getFormattedResponse())
  }
}

const restPassword = async (req, res, next) => {
  try {
    const token = req.params.token;
    const { newpassword, passwordConform } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await userModel.findOne({
      passwordRestToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      throw new ApiError("Reset password link is expired", 412);
    }
    user.password = newpassword;
    user.passwordConfirm = passwordConform;
    user.passwordRestToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    const jwttoken = signToken(user._id);
    return res.status(200).json({
      success: true,
      data: { token: jwttoken, },
      msg: "password change successfully",
    });
  } catch (err) {
    return res.status(err.code).json(err.getFormattedResponse())
  }
}

const updatePassword = async (req, res, _next) => {
  try {
    const { _id, oldPassword, newpassword, newPasswordConfirm } = req.body;
    const user = await userModel.findById(_id).select("+password");
    if (!user) {
      throw new ApiError("No such user exists!")
    }
    const correct = await user.correctPassword(oldPassword, user.password);
    if (!correct) {
      throw new ApiError("The old password provieded is incorrect!", 412)
    }
    user.password = newpassword;
    user.passwordConfirm = newPasswordConfirm;
    await user.save();
    const jwttoken = signToken(user._id);
    return res.status(200).json({
      success: true,
      token: jwttoken,
      msg: "password change successfully",
    });
  } catch (err) {
    return res.status(err.code).json(err.getFormattedResponse())
  }
}

const updateUserData = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      throw new ApiError("No such user exists!", 412)
    }

    return res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
      msg: "date updated successfully",
    });
  } catch (err) {
    return res.status(err.code).json(err.getFormattedResponse())
  }
}

const uploadProfle = async (req, res, next) => {
  try {
    let token;
    const result = await profilepic(req.file);
    if (!result) {
      throw new ApiError("Something went wrong while uploading image", 500)
    }

    token = req.headers.authorization.split(" ")[1];
    const decoded = await promisify(jwt.verify)(token, JWT_SERCTET);

    if (result) {
      const updatedUser = await userModel.findByIdAndUpdate(
        decoded.id,
        { avator: result.imageUrl },
        { new: true }
      );
      if (!updatedUser) {
        return ApiError("user did not found", 400)
      }
      return res.status(200).json({
        success: true,
        msg: "image uploaded successfully",
        data: { user: updatedUser },
      });
    } else {
      throw new ApiError("image not found", 400);
    }
  } catch (err) {
    return res.status(err.code).json(err.getFormattedResponse())
  }
}
/*
  This route is use to set passsword of the users who join some admin 
  as his/her teeam members
*/
const setUserPassword = async (req, res, next) => {
  try {
    const { password, token } = req.body;
    if (!password || !token) {
      throw new ApiError("both token and password and token are required", 412);
    }
    const decoded = jwt.verify(token, JWT_SERCTET);
    if (decoded.id) {
      const foundedUser = await userModel.findOne({ _id: decoded.id });
      if (!foundedUser) {
        throw new ApiError("No such user exists invalid token", 412);
      }
      if (foundedUser.usedLink == true) {
        throw new ApiError("This link is already used");
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
    return res.status(err.code).json(err.getFormattedResponse());
  }
};

module.exports = {
  singup,
  login,
  forgetPassword,
  restPassword,
  updatePassword,
  updateUserData,
  loginwithgoogle,
  uploadProfle,
  setUserPassword,
};
