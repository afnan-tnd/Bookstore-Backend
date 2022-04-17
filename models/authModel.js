const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, "first_name is required field"],
    },
    last_name: {
      type: String,
      required: [true, "last_name is required field"],
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "invalid email"],
    },
    phone: {
      type: String,
      default: null,
    },
    role: { type: String, default: "customer" },
    avator: {
      type: String,
      default:
        "https://cherryhill12.s3.sa-east-1.amazonaws.com/dummy+avator.jpg",
    },
    is_google_login: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: [true, "password is required field"],

      selected: false,
    },
    password_changed_at: Date,
    password_reset_token: String,
    passwordResetExpires: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  enterPassword,
  userPassword
) {
  return await bcrypt.compare(enterPassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.password_changed_at) {
    const changedTimestamp = parseInt(
      this.password_changed_at.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const restToken = crypto.randomBytes(32).toString("hex");
  this.password_reset_token = crypto
    .createHash("sha256")
    .update(restToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return restToken;
};

const User = mongoose.model("user", userSchema);

module.exports = User;
