import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true, minlength: 3 },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  verified: { type: Boolean, default: false },
  confirmationToken: String
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.confirmationToken;
  }
});

const User = mongoose.model("User", userSchema);
export default User;
