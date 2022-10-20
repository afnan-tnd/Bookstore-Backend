const express = require('express');
const  {newUser, insertManyUsers, deleteUser, getUsers, getUserBooks}  = require('../controllers/userController')
const router = express.Router();

router.post('/create',newUser);
router.post('/createMany',insertManyUsers);
router.delete('/:id',deleteUser);
router.get('/get/all',getUsers);
router.get('/books/:id',getUserBooks);

module.exports = router;