const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
  
    {
        name: {type: String}, 
        phoneNumber: {type: String}, 
        city: {type: String}, 
        state: {type: String}, 
        address: {type: String}, 
        email: {type: String, required:true}, 
    },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

const User = mongoose.model("users", userSchema);

module.exports = User;
