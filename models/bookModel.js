const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        title:{type:String},
        author:{type:mongoose.SchemaTypes.ObjectId}
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        timestamps: true,
      }
);

const bookModel = mongoose.model("books",bookSchema);

module.exports = bookModel;