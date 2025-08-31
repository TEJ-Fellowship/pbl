import mongoose from "mongoose";

const Schema = mongoose.Schema;

const propertySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    placeName: { type: String },
    description: { type: String, required: true },
    propertyType: { type: String, required: true },
    price: { type: String, required: true },
    images: [{ type: String, required: true }],
    features: [{ type: String, required: true }],
    beds: { type: Number, required: true },
    parking: {
      type: String,
      required: true,
      enum: ["No Parking", "1 Space", "2+ Spaces", "Covered"],
    },
    listedAt: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

propertySchema.index({ location: "2dsphere" });

export const Property = mongoose.model("Property", propertySchema);
