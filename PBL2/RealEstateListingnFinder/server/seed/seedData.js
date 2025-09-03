import dotenv from 'dotenv';
dotenv.config();

import connectDB from "../config/db.js"
import mongoose from 'mongoose';

import { User } from "../models/UserModel.js";
import { Property } from "../models/PropertyModel.js";


const seedData = async () => {

    try {
        console.log("Mongo URL:", process.env.MONGODB_URL);
        await connectDB(process.env.MONGODB_URL);

        await User.deleteMany({});
        await Property.deleteMany({});

        const user = new User({
            name: "Mango Dutta",
            email: "mangochocolate@seed.com",
            password: "mangohasseed",
            properties: [],
            favorites: [],
            role: 'user'
        })

        await user.save();

        const property = new Property({
            title: "Modern Luxury Villa",
            location: "Kathmandu, Nepal",
            description: "A beautiful modern villa with spacious rooms, private garden, and scenic mountain views.",
            propertyType: "Villa",
            price: "500000",
            images: ["https://example.com/images/villa1.jpg", "https://example.com/images/villa2.jpg"],
            features: ["Swimming Pool", "Gym", "Garden", "Solar Panels"],
            beds: 4,
            parking: true,
            size: 3500,
            listedAt: new Date("2025-08-01"),
            createdBy: user._id
        });
        user.properties.push(property._id);
        await property.save();
        console.log("Database seeded successfully")
        await mongoose.connection.close();
    } catch (err) {
        console.log("Error seeding data", err)
    }

}

seedData();