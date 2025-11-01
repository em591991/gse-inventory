import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";

export default function Locations() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  // Fetch locations - FIXED URL
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await axiosClient.get("/locations/");  // ✅ FIXED
      return response.data;
    },
  });

  // Create/Update location mutation - FIXED URLS
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      console.log("Sending to backend:", data);
      
      if (editingLocation) {
        // Update existing location - FIXED URL
        return axiosClient.put(
          `/locations/${editingLocation.location_id}/`,  // ✅ FIXED
          data
        );
      }
      // Create new location - FIXED URL
      return axiosClient.post("/locations/", data);  // ✅ FIXED
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["locations"]);
      setShowForm(false);
      setEditingLocation(null);
      alert("Location saved successfully!");
    },
    onError: (error) => {
      console.error("Error saving location:", error);
      console.error("Error response:", error.response?.data);
      alert(
        "Failed to save location: " +
          (error.response?.data?.detail ||
            JSON.stringify(error.response?.data) ||
            error.message)
      );
    },
  });

  // Delete location mutation - FIXED URL
  const deleteMutation = useMutation({
    mutationFn: (location_id) =>
      axiosClient.delete(`/locations/${location_id}/`),  // ✅ FIXED
    onSuccess: () => {
      queryClient.invalidateQueries(["locations"]);
      alert("Location deleted successfully!");
    },
    onError: (error) => {
      console.error("Error deleting location:", error);
      alert(
        "Failed to delete location. " +
          (error.response?.data?.detail ||
            "This location may have vehicles or inventory assigned to it.")
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      name: formData.get("name"),
      type: formData.get("type"),
      is_active: formData.get("is_active") === "on",
    };

    console.log("Form data before sending:", data);
    saveMutation.mutate(data);
  };

  const locationsList = Array.isArray(locationsData)
    ? locationsData
    : locationsData?.results || [];

  const getTypeBadgeColor = (type) => {
    const colors = {
      WAREHOUSE: "bg-blue-100 text-blue-800",
      TRUCK: "bg-green-100 text-green-800",
      JOB: "bg-yellow-100 text-yellow-800",
      STORAGE: "bg-purple-100 text-purple-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={() => {
            setShowForm(true);
            setEditingLocation(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Location
        </button>
      </div>

      {/* Location Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingLocation ? "Edit Location" : "New Location"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingLocation?.name || ""}
                  placeholder="e.g., Main Warehouse, Shop, Field Office"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  maxLength="120"
                />
                <p className="text-xs text-gray-500 mt-1">Max 120 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  required
                  defaultValue={editingLocation?.type || ""}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type...</option>
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="TRUCK">Truck</option>
                  <option value="JOB">Jobsite</option>
                  <option value="STORAGE">Storage</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  defaultChecked={editingLocation?.is_active ?? true}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active Location
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Inactive locations won't appear in dropdowns
              </p>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {saveMutation.isPending
                    ? "Saving..."
                    : editingLocation
                    ? "Update Location"
                    : "Create Location"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingLocation(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Locations List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-6">Loading locations...</div>
        ) : locationsList.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="mb-4">No locations yet.</p>
            <p className="text-sm">
              Add your first location to get started! Locations are used to track
              where vehicles and inventory are stored.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {locationsList.map((location) => (
                  <tr key={location.location_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{location.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadgeColor(
                          location.type
                        )}`}
                      >
                        {location.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {location.is_active ? (
                        <span className="text-green-600 font-medium">Active</span>
                      ) : (
                        <span className="text-gray-400">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => {
                          setEditingLocation(location);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete location "${location.name}"?\n\nThis may affect vehicles and inventory assigned to this location.`
                            )
                          ) {
                            deleteMutation.mutate(location.location_id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {locationsList.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Locations</div>
            <div className="text-2xl font-bold">{locationsList.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Warehouses</div>
            <div className="text-2xl font-bold">
              {locationsList.filter((l) => l.type === "WAREHOUSE").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Trucks</div>
            <div className="text-2xl font-bold">
              {locationsList.filter((l) => l.type === "TRUCK").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {locationsList.filter((l) => l.is_active).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}