import { Plus, X } from "lucide-react";
import { useState } from "react";

const ManageProperty = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

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
                  <tr className="border-t border-t-gray-200 hover:bg-gray-50">
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      Cozy 2-Bedroom Apartment
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      $180000
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-nnoraml leading-normal">
                      Apartment
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      Kupondole, Achaar Ghar
                    </td>
                    <td className="h-16 px-4 py-2">
                      <div className="flex gap-2">
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button className="text-red-600 text-sm font-medium hover:text-red-800">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t border-t-gray-200 hover:bg-gray-50">
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      Cozy 2-Bedroom Apartment
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      $180000
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-nnoraml leading-normal">
                      Apartment
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      Kupondole, Achaar Ghar
                    </td>
                    <td className="h-16 px-4 py-2">
                      <div className="flex gap-2">
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button className="text-red-600 text-sm font-medium hover:text-red-800">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t border-t-gray-200 hover:bg-gray-50">
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      Cozy 2-Bedroom Apartment
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      $180000
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-nnoraml leading-normal">
                      Apartment
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      Kupondole, Achaar Ghar
                    </td>
                    <td className="h-16 px-4 py-2">
                      <div className="flex gap-2">
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button className="text-red-600 text-sm font-medium hover:text-red-800">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t border-t-gray-200 hover:bg-gray-50">
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      Cozy 2-Bedroom Apartment
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      $180000
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-nnoraml leading-normal">
                      Apartment
                    </td>
                    <td className="h-16 px-4 py-2 text-gray-900 text-sm font-normal leading-normal">
                      Kupondole, Achaar Ghar
                    </td>
                    <td className="h-16 px-4 py-2">
                      <div className="flex gap-2">
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button className="text-red-600 text-sm font-medium hover:text-red-800">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                    placeholder="Eg., Spacious 3-Bedroom Apartment"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 text-base font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe your property in detail"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 min-h-20 resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-900 text-base font-medium mb-2">
                      Price
                    </label>
                    <input
                      placeholder="eg., 250000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-g text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-900 text-base font-medium mb-2">
                      Property Type
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 foucs:outline-0 focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Property Type</option>
                      <option value="apartment">Apartmnet</option>
                      <option value="house">House</option>
                      <option value="condo">Condo</option>
                      <option value="TownHouse">Town House</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-900 text-base font-medium mb-2">
                    Location
                  </label>
                  <input
                    placeholder="e.g., 123 Main Street, Anytown"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 text-base font-medium mb-2">
                    Images
                  </label>
                  <input
                    type="file"
                    multiple
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
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
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
