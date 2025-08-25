import { Property } from "../models/PropertyModel.js";

export const getAllProperty = async (request, response) => {
    try {
        const properties = await Property.find({});
        response.status(200).json(properties);
    } catch (err) {
        console.log(err)
        response.status(500).json({ message: "server error" })
    }

}


export const addProperty = async (request, response) => {
    try {
        const { title, description, location, beds, price, features, parking, propertyType } = request.body;

        /*
            for files, images while using multer request.body won't have the file but request.files
        */
        const imagePaths = request.files.map((file) => file.path)

        const newProperty = new Property({
            title,
            description,
            location,
            parking,
            propertyType,
            images: imagePaths,
            features: features ? features.split(",") : [],
            beds,
            price,
            listedAt: Date.now()
        })


        const savedProperty = await newProperty.save();

        response.status(201).json({
            message: "Property created",
            property: savedProperty
        })

        console.log(savedProperty)

    } catch (e) {
        console.log(e)
        response.status(500).json({ message: "Server Error" })
    }




}
