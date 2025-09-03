import mongoose from "mongoose";
import { Property } from "../models/PropertyModel.js";
import cloudinary from "../utils/cloudinary.js";

export const getAllProperty = async (req, res) => {
  try {
    // Build query object based on filters
    let query = {};

    // Price range filtering
    if (req.query.priceRange) {
      const priceRanges = req.query.priceRange.split(",");
      const priceConditions = [];

      priceRanges.forEach((range) => {
        switch (range) {
          case "Under $500K":
            priceConditions.push({ price: { $regex: /^[0-4]\d{0,5}$/ } });
            break;
          case "$500K-$750K":
            priceConditions.push({
              $and: [
                { price: { $regex: /^[5-7]\d{5}$/ } },
                { price: { $lte: "750000" } },
              ],
            });
            break;
          case "$750K-$1M":
            priceConditions.push({
              $and: [
                { price: { $gte: "750000" } },
                { price: { $lte: "1000000" } },
              ],
            });
            break;
          case "$1M-$1.5M":
            priceConditions.push({
              $and: [
                { price: { $gte: "1000000" } },
                { price: { $lte: "1500000" } },
              ],
            });
            break;
          case "$1.5M+":
            priceConditions.push({ price: { $gte: "1500000" } });
            break;
        }
      });

      if (priceConditions.length > 0) {
        query.$or = priceConditions;
      }
    }

    // Beds filtering
    if (req.query.beds) {
      const bedOptions = req.query.beds.split(",");
      const bedConditions = [];

      bedOptions.forEach((option) => {
        if (option === "1+") bedConditions.push({ beds: { $gte: 1 } });
        else if (option === "2+") bedConditions.push({ beds: { $gte: 2 } });
        else if (option === "3+") bedConditions.push({ beds: { $gte: 3 } });
        else if (option === "4+") bedConditions.push({ beds: { $gte: 4 } });
        else if (option === "5+") bedConditions.push({ beds: { $gte: 5 } });
      });

      if (bedConditions.length > 0) {
        query.$or = query.$or
          ? [...query.$or, ...bedConditions]
          : bedConditions;
      }
    }

    // Property type filtering
    if (req.query.propertyType) {
      const types = req.query.propertyType
        .split(",")
        .filter((type) => type !== "Any");
      if (types.length > 0) {
        query.propertyType = { $in: types.map((type) => type.toLowerCase()) };
      }
    }

    // Features filtering
    if (req.query.features) {
      const selectedFeatures = req.query.features.split(",");
      query.features = { $all: selectedFeatures };
    }

    // Parking filtering
    if (req.query.parking) {
      const parkingOptions = req.query.parking.split(",");

      // Filter out "Any" if present
      const validOptions = parkingOptions.filter((opt) => opt !== "Any");

      if (validOptions.length > 0) {
        query.parking = { $in: validOptions };
      }
    }

    // Date filtering for listing age
    if (req.query.listingAge) {
      const listingAge = req.query.listingAge.split(",")[0]; // Take first option
      const now = new Date();
      let dateThreshold;

      switch (listingAge) {
        case "Last 24 hours":
          dateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "Last Week":
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "Last Month":
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateThreshold = null;
      }

      if (dateThreshold) {
        query.listedAt = { $gte: dateThreshold };
      }
    }

    // Sorting
    let sortQuery = {};
    const sortBy = req.query.sort || "Relevance";

    switch (sortBy) {
      case "Price: Low to High":
        sortQuery = { price: 1 };
        break;
      case "Price: High to Low":
        sortQuery = { price: -1 };
        break;
      case "Newest First":
        sortQuery = { listedAt: -1 };
        break;
      case "Size: Largest First":
        sortQuery = { beds: -1 };
        break;
      case "Most Popular":
        sortQuery = { listedAt: -1 }; // Default to newest for now
        break;
      default:
        sortQuery = { listedAt: -1 };
    }

    const properties = await Property.find(query).sort(sortQuery);
    res.status(200).json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPropertyById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid property id" });
    }

    const property = await Property.findById(id);
    if (!property) return res.status(400).json({ error: "Property not found" });
    return res.status(200).json(property);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

export const addProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      beds,
      price,
      placeName,
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

    const location = req.body.location ? JSON.parse(req.body.location) : null;

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
      placeName,
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
      beds,
      price,
      features,
      placeName,
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

    const location = req.body.location
      ? JSON.parse(req.body.location)
      : property.location;

    property.title = title || property.title;
    property.description = description || property.description;
    property.location = location;
    property.beds = beds ?? property.beds;
    property.price = price ?? property.price;
    property.features = features ? features.split(",") : property.features;
    property.parking = parking || property.parking;
    property.propertyType = propertyType || property.propertyType;
    property.placeName = placeName || property.placeName; // <-- update placeName

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
