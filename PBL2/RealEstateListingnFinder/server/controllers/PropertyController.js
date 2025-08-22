import { Property } from "../models/PropertyModel.js";

export const getAllDetail = async(request, response) => {
    const properties = await Property.find({});
    response.json(properties);
}

