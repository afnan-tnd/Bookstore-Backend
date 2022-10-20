const bookModel = require("../models/bookModel");
const userModel = require("../models/userModel");

const createBook = async (req, res, next) => {
  try {
    console.log(req.body);
    await bookModel.create({
      title: req.body.title,
      author: req.body.author,
    });
    return res.status(200).json({
      msg: "Book Added",
    });
  } catch (e) {
    return res.status(400).json({
      msg: e.message,
    });
  }
};

const getBook = async (req, res, next) => {
  try {
    let data = {};
    console.log(req.params.id);
    const book = await bookModel.findOne({_id:req.params.id});
    if(book){
        data = {}
        const author = await userModel.findOne({_id:book.author})
        data = {
            bookId:book._id,
            authorId:author._id,
            title:book.title,
            author:author.name,
            city:author.city,
            state:author.state,
            address:author.address,
        }
        res.status(200).json({
            data,
            msg:"success"
        })
    }else{
        return res.status(404).json({
            msg: "Book not found",
          });
    }
  } catch (e) {
    return res.status(400).json({
      msg: e.message,
    });
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const data = await bookModel.findOne({ _id: req.params.id });
    if (data) {
      await bookModel.deleteOne({ _id: req.params.id });
      return res.status(200).json({
        msg: "deleted successfully",
      });
    } else {
      return res.status(404).json({
        msg: "Book not found",
      });
    }
  } catch (e) {
    return res.status(400).json({
      msg: e.message,
    });
  }
};
const updateBook = async (req, res, next) => {
  try {
    const data = await bookModel.findOneAndUpdate({ _id: req.params.id },{author:req.body.author},{
        new:true
    });
    
      return res.status(200).json({
        data,
        msg: "updated successfully",
      });
    
    
  } catch (e) {
    return res.status(400).json({
      msg: e.message,
    });
  }
};

module.exports = { createBook, getBook, deleteBook, updateBook };
