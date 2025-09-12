// import mongoose from "mongoose";

// const optionSchema = new mongoose.Schema({
//   text: {
//     type: String,
//     required: true,
//     min: 1,
//     max: 20,
//   },
//   votes: {
//     type: Number,
//     default: 0,
//   },
// });

// const pollSchema = new mongoose.Schema({
//   question: {
//     type: String,
//     required: true,
//     min: 5,
//     max: 50,
//   },
//   options: [optionSchema],
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },

//   expiresAt: {
//     type: Date,
//     required: true,
//   },
//   votedBy: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   ],

//   status: {
//     type: String,
//     enum: ["open", "closed"],
//     default: "open",
//   },
// });
// const Poll = mongoose.model("Poll", pollSchema);
// export default Poll;


import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
});

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [optionSchema],
    validate: v => v.length >= 2,
  },
  timer: {
    type: String,
    enum: ["no-timer", "5m", "15m", "30m", "1h", "24h"],
    default: "no-timer",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Poll = mongoose.models.Poll || mongoose.model("Poll", pollSchema);
export default Poll
// export default Poll;
//     createdAt:{
//         type: Date,
//         default:Date.now()
//     },
//     expiresAt:{
//         type:Date
//     },

//     userId:{
//         type:mongoose.Schema.Types.ObjectId,
//         ref:"User"
//     }


// })


// const Poll = mongoose.model("Poll",pollSchema)
// export default Poll
