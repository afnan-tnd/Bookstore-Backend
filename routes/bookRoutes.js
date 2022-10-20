const express = require("express");
const { createBook, getBook, deleteBook, updateBook } = require("../controllers/bookController");

const router = express.Router();


router.post('/new',createBook);
router.patch('/:id',updateBook);
router.get('/:id',getBook);
router.delete('/:id',deleteBook);

module.exports = router;