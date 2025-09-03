import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },

  properties: [
    {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
  ],

  favorites: [
    {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
  ],

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
});

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
