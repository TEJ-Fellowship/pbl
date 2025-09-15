const mongoose = require("mongoose");

const musicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, default: "Unknown Artist" },
  url: { type: String, required: true }, // the actual music file URL
  duration: { type: Number, required: true }, 
}, { timestamps: true }); 

musicSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Music=mongoose.model('music',musicSchema)
module.exports=Music;
