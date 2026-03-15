const mongoose = require('mongoose')

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  planName: { type: String, required: true },          // name of subscription plan
  isActive: { type: Boolean, default: false },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  amountPaid: { type: Number, required: true },
  paymentMethod: { type: String, required: true },    // e.g., card, paypal
  paymentStatus: { type: String, default: "Pending" }, // e.g., Paid, Pending, Failed
}, { timestamps: true }); 

subscriptionSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Subscription =  mongoose.model("subscription", subscriptionSchema);

module.exports = Subscription