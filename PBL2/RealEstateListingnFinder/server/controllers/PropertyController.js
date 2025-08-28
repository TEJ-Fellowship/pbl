import { Property } from "../models/PropertyModel.js";
import cloudinary from "../utils/cloudinary.js";

export const getAllProperty = async (req, res) => {
  try {
    const properties = await Property.find({});
    res.status(200).json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      beds,
      price,
      features,
      parking,
      propertyType,
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    // Upload all images to Cloudinary in parallel
    const uploadedImages = await Promise.all(
      req.files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "properties" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            );
            stream.end(file.buffer);
          })
      )
    );

    const newProperty = new Property({
      title,
      description,
      location,
      parking,
      propertyType,
      images: uploadedImages || [],
      features: features ? features.split(",") : [],
      beds,
      price,
      listedAt: Date.now(),
    });

    const savedProperty = await newProperty.save();

    res.status(201).json({
      message: "Property created successfully",
      property: savedProperty,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;

    const {
      title,
      description,
      location,
      beds,
      price,
      features,
      parking,
      propertyType,
    } = req.body;

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(401).json({ message: "Property not found" });
    }

    let uploadedImages = [];

    if (req.files && req.files.length > 0) {
      uploadedImages = await Promise.all(
        req.files.map((file) => {
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "properties",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            );
            stream.end(file.buffer);
          });
        })
      );
    }

    property.title = title || property.title;
    property.description = description || property.description;
    property.location = location || property.location;
    property.beds = beds ?? property.beds;
    property.price = price ?? property.price;
    property.features = features ? features.split(",") : property.features;
    property.parking = parking || property.parking;
    property.propertyType = propertyType || property.propertyType;

    if (uploadedImages.length > 1) {
      property.images = [...property.images, ...uploadedImages];
    }

    const updatedProperty = await property.save();

    res.status(200).json({
      message: "Property updated successfully",
      property: updatedProperty,
    });
  } catch (err) {
    console.log(err);
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const deletePropertyId = req.params.id;
    if (!deletePropertyId) return "Not Delete Property";

    const deletedProperty = await Property.findByIdAndDelete(deletePropertyId);
    if (!deletedProperty)
      return res.status(401).json({ message: "Property not Found" });

    res.status(200).json({ message: "Property deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
