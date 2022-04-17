// Packages
const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
    res.status(200).send(`The server is healthy!`);
});

module.exports = router;
