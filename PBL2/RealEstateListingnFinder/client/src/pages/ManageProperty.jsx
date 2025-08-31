import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useProperties } from "../hooks/useProperties";
import MapPicker from "../components/Map/MapPicker";
import { useEffect } from "react";
import { getPlaceName } from "../components/Map/utils/GetPlaceName";

const ManageProperty = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [propertyDetail, setPropertyDetail] = useState({
    title: "",
    description: "",
    price: "",
    parking: "",
    features: [],
    beds: 0,
    propertyType: "",
    location: null,
    images: [],
  });

  const [editPropertyId, setEditPropertyId] = useState(null);
  const [placeName, setPlaceName] = useState("");

  const handleDelete = async (property) => {
    const deletePropertyId = property._id;

    if (!window.confirm("Are you sure you want to delete it ?")) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/properties/delete-property/${deletePropertyId}`, // Fixed: Added port 5000
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (res.ok) {
        refetch();
      } else {
        console.log("Failed to delete property");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const openEditModal = (property) => {
    setEditPropertyId(property._id);
    console.log(property);

    setPropertyDetail({
      title: property.title,
      description: property.description,
      price: property.price,
      parking: property.parking, // Fixed: was property.price
      features: Array.isArray(property.features) ? property.features : [],
      beds: property.beds,
      propertyType: property.propertyType,
      location: property.location,
      images: [],
    });

    setIsModalOpen(true);
  };

  const { properties, refetch } = useProperties();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPropertyDetail((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async () => {
    const formData = new FormData();

    if (propertyDetail.location) {
      const { lat, lng } = propertyDetail.location;
      const placeNameValue = await getPlaceName(lat, lng); // your existing function
      propertyDetail.placeName = placeNameValue;
    }

    Object.keys(propertyDetail).forEach((key) => {
      if (key !== "images" && key != "location") {
        formData.append(key, propertyDetail[key]);
      }
    });

    if (propertyDetail.location) {
      formData.append(
        "location",
        JSON.stringify({
          type: "Point",
          coordinates: [
            propertyDetail.location.lng,
            propertyDetail.location.lat,
          ],
        })
      );
    }

    for (let i = 0; i < propertyDetail.images.length; i++) {
      formData.append("images", propertyDetail.images[i]);
    }

    try {
      let response;
      console.log(editPropertyId);
      if (editPropertyId) {
        response = await fetch(
          `http://localhost:8080/api/properties/edit-property/${editPropertyId}`,
          {
            method: "PUT",
            body: formData,
          }
        );
      } else {
        response = await fetch(
          "http://localhost:8080/api/properties/add-property",
          {
            method: "POST",
            body: formData,
          }
        );
      }

      const data = await response.json();
      console.log(data);
      refetch();
      closeModal();
      setEditPropertyId(null);
      setPropertyDetail({
        title: "",
        description: "",
        price: "",
        parking: "",
        features: [],
        beds: 0,
        propertyType: "",
        location: "",
        placeName: "",
        images: [],
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="px-40 flex flex-1 justify-center py-5">
        <div className="layout-content-container flex flex-col max-w-6xl flex-1">
          {/* Page Header */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <div className="flex min-w-27 flex-col gap-3">
              <p className="text-gray-900 tracking-tight text-3xl font-bold leading-tight">
                Manage Your Listings
              </p>
              <p className="text-slate-600 text-sm font-normal leading-normal">
                Add, Edit or Remove your Property.
              </p>
            </div>
            <div className="flex items-center">
              <button
                onClick={openModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Property
              </button>
            </div>
          </div>

          <h3 className="text-gray-900 text-lg font-bold leading-tight tracking tight px-4 pb-2 pt-2">
            Existing Listing
          </h3>
          <div className="px-4 py-3">
            <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="flex-1">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-gray-900 text-sm font-medium leading-normal">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-gray-900 text-sm font-medium leading-normal">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-gray-900 text-sm font-medium leading-normal">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-gray-900 text-sm font-medium leading-normal">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-gray-900 text-sm font-medium leading-normal">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr
                      key={property._id}
                      className="border-t border-t-gray-200 hover:bg-gray-50"
                    >
                      <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                        {property.title}
                      </td>
                      <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                        ${property.price?.toLocaleString()}
                      </td>
                      <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                        {property.propertyType}
                      </td>
                      <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                        {property.placeName}
                      </td>
                      <td className="h-16 px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(property)}
                            className="text-blue-600 text-sm font-medium hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(property)}
                            className="text-red-600 text-sm font-medium hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 my-8 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editPropertyId ? "Edit Property" : "Add New Property"}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={closeModal}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-900 text-base font-medium mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                    placeholder="Eg., Spacious 3-Bedroom Apartment"
                    value={propertyDetail.title}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-gray-900 text-base font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Describe your property in detail"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 min-h-20 resize-none"
                    value={propertyDetail.description}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-900 text-base font-medium mb-2">
                      Price
                    </label>
                    <input
                      name="price"
                      placeholder="eg., 250000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                      type="number"
                      value={propertyDetail.price}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-900 text-base font-medium mb-2">
                      Parking
                    </label>
                    <select
                      name="parking"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500"
                      value={propertyDetail.parking}
                      onChange={handleChange}
                    >
                      <option value="">Select Parking</option>
                      <option value="No Parking">No Parking</option>
                      <option value="1 Space">1 Space</option>
                      <option value="2+ Spaces">2+ Spaces</option>
                      <option value="Covered">Covered</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-900 text-base font-medium mb-2">
                      Property Type
                    </label>
                    <select
                      name="propertyType"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500"
                      value={propertyDetail.propertyType}
                      onChange={handleChange}
                    >
                      <option value="">Select Property Type</option>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="villa">Villa</option>
                      <option value="studio">Studio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-900 text-base font-medium mb-2">
                      Beds
                    </label>
                    <input
                      name="beds"
                      placeholder="Number of bedrooms"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                      type="number"
                      min="0"
                      value={propertyDetail.beds}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-900 text-base font-medium mb-2">
                    Features
                  </label>
                  <select
                    name="features"
                    multiple
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500"
                    value={propertyDetail.features}
                    onChange={(e) => {
                      const selectedOptions = Array.from(
                        e.target.selectedOptions
                      ).map((option) => option.value);

                      setPropertyDetail((prev) => ({
                        ...prev,
                        features: selectedOptions,
                      }));
                    }}
                  >
                    <option value="Swimming Pool">Swimming Pool</option>
                    <option value="Gym">Gym</option>
                    <option value="Parking">Parking</option>
                    <option value="Balcony">Balcony</option>
                    <option value="Garden">Garden</option>
                    <option value="Security">Security</option>
                    <option value="Elevator">Elevator</option>
                    <option value="AC">AC</option>
                    <option value="Furnished">Furnished</option>
                  </select>
                  <div className="mt-2">
                    <strong>Selected Features:</strong>{" "}
                    {propertyDetail.features.join(", ") || "None"}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-900 text-base font-medium mb-2">
                    Select Property Location
                  </label>
                  <MapPicker
                    initialLat={27.7}
                    initialLng={85.3}
                    onLocationSelect={async (loc) => {
                      // Set location in state
                      setPropertyDetail((prev) => ({
                        ...prev,
                        location: { lat: loc.lat, lng: loc.lng },
                      }));

                      // Get place name directly without useEffect
                      if (loc.lat && loc.lng) {
                        const name = await getPlaceName(loc.lat, loc.lng);
                        setPlaceName(name);
                      }
                    }}
                  />
                  {propertyDetail.location && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected Location: {placeName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-900 text-base font-medium mb-2">
                    Images
                  </label>
                  <input
                    type="file"
                    multiple
                    name="images"
                    accept="image/*"
                    onChange={(e) =>
                      setPropertyDetail((prev) => ({
                        ...prev,
                        images: e.target.files,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-500 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {editPropertyId ? "Update Property" : "Add Property"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageProperty;
