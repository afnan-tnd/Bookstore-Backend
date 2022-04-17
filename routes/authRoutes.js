const express = require("express");

const {
  singup,
  login,
  forgetPassword,
  restPassword,
  updatePassword,
  uploadProfle,
  updateUserData,
  loginwithgoogle,
  setUserPassword,
} = require("../controllers/authController");

const { protected } = require("../middleware");
const multer = require("multer");

const router = express.Router();
const storage = multer.memoryStorage();

const upload = multer({ storage });

router.post("/singup", singup);
router.post("/login", login);
router.post("/forgetPassword", forgetPassword);

router.patch("/restPassword/:token", restPassword);
router.patch("/updatePassword", protected, updatePassword);

router.patch("/updateUserData", protected, updateUserData);

router.post("/googlelogin", loginwithgoogle);
router.post("/uploadProfle", upload.single("image"), uploadProfle);
router.post("/setUserPassword", setUserPassword);
module.exports = router;
