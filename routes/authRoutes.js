const express = require("express");

const {
  signup,
  login,
  forgetPassword,
  restPassword,
  updatePassword,
  updateUserData,
  setUserPassword,
} = require("../controllers/authController");

const { protected } = require("../middleware");
const multer = require("multer");

const router = express.Router();
const storage = multer.memoryStorage();

const upload = multer({ storage });

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgetPassword", forgetPassword);

router.patch("/restPassword/:token", restPassword);
router.patch("/updatePassword", protected, updatePassword);

router.patch("/updateUserData", protected, updateUserData);

router.post("/setUserPassword", setUserPassword);
module.exports = router;
