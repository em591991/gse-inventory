import React from "react";
import { Link } from "react-router-dom";

export default function Orders() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Orders</h1>

        {/* Later this might link to a Create Order form */}
        <Link
          to="/vendors"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Vendors
        </Link>
      </div>

      <p className="text-gray-600">
        This page will eventually list purchase orders and their statuses.
      </p>
    </div>
  );
}
