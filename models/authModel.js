const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
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
    role: { type: String, default: "admin" },
    avator: {
      type: String,
      default:
        "https://cherryhill12.s3.sa-east-1.amazonaws.com/dummy+avator.jpg",
    },
    isGoogleLogin: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,

      selected: false,
    },
    passwordChangedAt: Date,
    passwordRestToken: String,
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
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const restToken = crypto.randomBytes(32).toString("hex");
  this.passwordRestToken = crypto
    .createHash("sha256")
    .update(restToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return restToken;
};

const User = mongoose.model("user", userSchema);

module.exports = User;
