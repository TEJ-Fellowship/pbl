import mongoose from "mongoose";

const Schema = mongoose.Schema;

const propertySchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    location: { type: String, required: true },
    description: { type: String, required: true },
    propertyType: { type: String, required: true },
    price: { type: String, required: true },
    images: [{ type: String, required: true }],
    features: [{ type: String, required: true }],
    beds: { type: Number, required: true },
    parking: { type: Boolean, required: true },
    listedAt: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

export const Property = mongoose.model('Property', propertySchema)