import React from "react";
import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";

const RestrictedAccess = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-blue-100 p-6 rounded-full mb-6">
        <LockKeyhole className="h-16 w-16 text-blue-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        Access Restricted
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-lg">
        You need to sign in to access this content and explore all the features
        of MA Properties Inc.
      </p>
      <Link
        to="/auth"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Sign In / Sign Up
      </Link>
    </div>
  );
};

export default RestrictedAccess;
