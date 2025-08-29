import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useProperties } from "../hooks/useProperties";
import MapPicker from "../components/Map/MapPicker";

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
    location: "",
    images: [],
  });

  const [editPropertyId, setEditPropertyId] = useState(null);

  const handleDelete = async (property) => {
    const deletePropertyId = property._id;

    if (!window.confirm("Are you sure you want to delete it ?")) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/properties/delete-property/${deletePropertyId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (res.ok) {
        // setProperties((prev) => prev.filter((p) => p._id !== propertyId));
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
      parking: property.price,
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
    const { name, value } = e.target; //returns the name of input and value of inputs
    setPropertyDetail((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async () => {
    const formData = new FormData();

    /* 
    FormData is a builtin javascript object to send data(files, images) over HTTP

    Json doesn't includes files

    we could also do the regular way for other field but we have to call api 2 times,
    which is not optimal
  */

    Object.keys(propertyDetail).forEach((key) => {
      if (key !== "images") {
        formData.append(key, propertyDetail[key]);
      }
    });

    for (let i = 0; i < propertyDetail.images.length; i++) {
      formData.append("images", propertyDetail.images[i]);
    }

    try {
      let response;
      console.log(editPropertyId);
      if (editPropertyId) {
        // Edit existing property
        response = await fetch(
          `http://localhost:8080/api/properties/edit-property/${editPropertyId}`,
          {
            method: "PUT",
            body: formData,
          }
        );
      } else {
        // Add new property
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
            Exisiting Listing
          </h3>
          <div className="px-4 py-3">
            <div className="flex  overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
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
                        {property.price}
                      </td>
                      <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                        {property.propertyType}
                      </td>
                      <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                        {property.location}
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
          <div className="bg-white rounded-lg shadow-2xl  max-w-2xl w-full mx-4 my-8 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Add New Property
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-g text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                      type="text"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 foucs:outline-0 focus:ring-2 focus:ring-blue-500"
                      value={propertyDetail.parking}
                      onChange={handleChange}
                    >
                      <option value="">Select Parking</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 foucs:outline-0 focus:ring-2 focus:ring-blue-500"
                      value={propertyDetail.propertyType}
                      onChange={handleChange}
                    >
                      <option value="">Select Property Type</option>
                      <option value="apartment">Apartmnet</option>
                      <option value="house">House</option>
                      <option value="condo">Condo</option>
                      <option value="TownHouse">Town House</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-900 text-base font-medium mb-2">
                      Beds
                    </label>
                    <input
                      name="beds"
                      placeholder=""
                      className="w-full px-4 py-3 border border-gray-200 rounded-g text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                      type="text"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 foucs:outline-0 focus:ring-2 focus:ring-blue-500"
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
                    <option value="Apartment">Apartmnet</option>
                    <option value="House">House</option>
                    <option value="Condo">Condo</option>
                    <option value="TownHouse">Town House</option>
                  </select>
                  <div className="mt-2">
                    <strong>Selected Categories:</strong>{" "}
                    {propertyDetail.features.join(", ") || "None"}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-900 text-base font-medium mb-2">
                    Select Property Location
                  </label>
                  <MapPicker
                    initialLat={27.7} // optional default latitude
                    initialLng={85.3} // optional default longitude
                    onLocationSelect={(loc) =>
                      setPropertyDetail((prev) => ({
                        ...prev,
                        location: `${loc.lat},${loc.lng}`,
                      }))
                    }
                  />
                  {propertyDetail.location && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected Location: {propertyDetail.location}
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
                Add Property
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageProperty;
