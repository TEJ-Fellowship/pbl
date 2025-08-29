import { Search, Bell, User, CreditCard, Shield } from "lucide-react";
import { useState, useMemo } from "react";

const UserDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const listings = [
    {
      id: 1,
      name: "Cozy Apartment in Downtown",
      status: "Active",
      price: "$250,000",
      statusColor: "green",
    },
    {
      id: 2,
      name: "Spacious House in Suburbia",
      status: "Pending",
      price: "$550,000",
      statusColor: "yellow",
    },
    {
      id: 3,
      name: "Luxury Condo with Ocean View",
      status: "Active",
      price: "$1,200,000",
      statusColor: "green",
    },
    {
      id: 4,
      name: "Rustic Cabin in the Woods",
      status: "Inactive",
      price: "$180,000",
      statusColor: "gray",
    },
    {
      id: 5,
      name: "Modern Townhouse in the City",
      status: "Active",
      price: "$420,000",
      statusColor: "green",
    },
  ];

  const filteredListings = useMemo(() => {
    if (!searchTerm) return listings;

    return listings.filter(
      (listing) =>
        listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.price.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-80 bg-white border-r border-gray-200 min-h-screen p-6">
          <h1 className="text-2xl font-bold mb-6">My Listings</h1>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search listings"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 font-medium text-gray-900">
                    Property
                  </th>
                  <th className="text-left py-3 font-medium text-gray-900">
                    Status
                  </th>
                  <th className="text-left py-3 font-medium text-gray-900">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredListings.map((listing) => (
                  <tr key={listing.id}>
                    <td className="py-4">
                      <div className="text-sm text-gray-900">
                        {listing.name}
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          listing.statusColor === "green"
                            ? "text-green-700 bg-green-100"
                            : listing.statusColor === "yellow"
                            ? "text-yellow-700 bg-yellow-100"
                            : "text-gray-700 bg-gray-100"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      {listing.price}
                    </td>
                  </tr>
                ))}
                {filteredListings.length === 0 && searchTerm && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      No listings found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Favorites</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Charming Cottage by the Lake
                  </h3>
                  <p className="text-gray-600 text-sm">
                    3 beds • 2 baths • 1,800 sq ft
                  </p>
                </div>
                <div className="w-80 h-40 ml-6">
                  <img
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
                    alt="Cottage by the lake"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-6">Account Settings</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Profile</h3>
                  <p className="text-sm text-gray-500">
                    Manage your profile information
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Billing</h3>
                  <p className="text-sm text-gray-500">
                    Update your payment methods
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Security</h3>
                  <p className="text-sm text-gray-500">Change your password</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
