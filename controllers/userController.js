const userModel = require("../models/userModel");
const bookModel = require("../models/bookModel");


const newUser = async (req,res,next) => {
   try{
      console.log(req.body)
      await userModel.create({
      name:req.body.name,
      phoneNumber:req.body.phoneNumber,
      email:req.body.email,
      city:req.body.city,
      address:req.body.address,
      state:req.body.state,
    });
   //  user.save()
   return res.status(200).json({
      msg:"user Added"
   });
   }catch(err){
      console.log(err.message);
      return res.status(400).json({ success: false, data: null, msg: err.message })
   }
}

const insertManyUsers = async (req,res,next)=>{
   try{
      console.log(req)
      await userModel.insertMany(req.body)
      return res.status(200).json({
         msg:"user Added"
      });
      }catch(err){
         console.log(err.message);
         return res.status(400).json({ success: false, data: null, msg: err.message })
      }

}
const deleteUser = async (req,res,next)=>{
   try{
      const book = await bookModel.findOne({author:req.params.id});
      console.log("book",book)
      if(!book){
         await userModel.findByIdAndRemove({_id:req.params.id});
         res.status(200).json({
            msg:"User Deleted successfully"
         })
      }else{
         res.status(404).json({
            msg:"Cannot delete User as user has assosiated book"
         })
      }
      }catch(err){
         console.log(err.message);
         return res.status(400).json({ success: false, data: null, msg: err.message })
      }

}
const getUsers = async (req,res,next)=>{
   try{
      const authors = await bookModel.find({}).distinct('author');
      console.log("authors",authors)
      const users = await userModel.find({'_id':{$in:authors}})
      console.log("authors",users)
      res.status(200).json({
         data:users,
         msg:"success"
      })
      }catch(err){
         console.log(err.message);
         return res.status(400).json({ success: false, data: null, msg: err.message })
      }

}
const getUserBooks = async (req,res,next)=>{
   try{
      const books = await bookModel.find({author:req.params.id});
      console.log("books",books)
      res.status(200).json({
         data:books,
         msg:"success"
      })
      }catch(err){
         console.log(err.message);
         return res.status(400).json({ success: false, data: null, msg: err.message })
      }

}


module.exports = {newUser, insertManyUsers, deleteUser, getUsers, getUserBooks};
 