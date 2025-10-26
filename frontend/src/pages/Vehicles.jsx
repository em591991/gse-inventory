import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";

export default function Vehicles() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showModelForm, setShowModelForm] = useState(false); // ✨ NEW
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editingModel, setEditingModel] = useState(null); // ✨ NEW
  const [selectedTab, setSelectedTab] = useState("vehicles");

  // Fetch vehicles
  const { data: vehiclesData, isLoading: loadingVehicles } = useQuery({
    queryKey: ["vehicles", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page, search });
      const response = await axiosClient.get(`/vehicles/vehicles/?${params}`);
      return response.data;
    },
    enabled: selectedTab === "vehicles",
  });

  // Fetch vehicle models
  const { data: modelsData, isLoading: loadingModels } = useQuery({
    queryKey: ["vehicle-models"],
    queryFn: async () => {
      const response = await axiosClient.get("/vehicles/models/");
      return response.data;
    },
  });

  //fetch locations
  const { data: locationsData } = useQuery({
  queryKey: ["locations"],
  queryFn: async () => {
    const response = await axiosClient.get("/locations/");
    return response.data;
  },
  });

const locationsList = Array.isArray(locationsData) 
  ? locationsData 
  : (locationsData?.results || []);

  // Create/Update vehicle mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingVehicle) {
        return axiosClient.put(`/vehicles/vehicles/${editingVehicle.vehicle_id}/`, data);
      }
      return axiosClient.post("/vehicles/vehicles/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicles"]);
      setShowForm(false);
      setEditingVehicle(null);
    },
  });

  // Create/Update model mutation ✨ NEW
  const saveModelMutation = useMutation({
    mutationFn: async (data) => {
      if (editingModel) {
        return axiosClient.put(`/vehicles/models/${editingModel.vehicle_model_id}/`, data);
      }
      return axiosClient.post("/vehicles/models/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicle-models"]);
      setShowModelForm(false);
      setEditingModel(null);
    },
  });

  // Delete vehicle mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => axiosClient.delete(`/vehicles/vehicles/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicles"]);
    },
  });

  // Delete model mutation ✨ NEW
  const deleteModelMutation = useMutation({
    mutationFn: (id) => axiosClient.delete(`/vehicles/models/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicle-models"]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    saveMutation.mutate(data);
  };

  // ✨ NEW: Handle model form submit
  const handleModelSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    saveModelMutation.mutate(data);
  };

  const statusColors = {
    AVAILABLE: "bg-green-100 text-green-800",
    IN_USE: "bg-blue-100 text-blue-800",
    MAINTENANCE: "bg-yellow-100 text-yellow-800",
    RETIRED: "bg-gray-100 text-gray-800",
  };

  // Get model list for dropdown
  const modelsList = Array.isArray(modelsData) ? modelsData : (modelsData?.results || []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Fleet Management</h1>
        <div className="flex gap-2">
          {selectedTab === "vehicles" && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingVehicle(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + New Vehicle
            </button>
          )}
          {selectedTab === "models" && (
            <button
              onClick={() => {
                setShowModelForm(true);
                setEditingModel(null);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + New Model
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setSelectedTab("vehicles")}
          className={`px-4 py-2 ${selectedTab === "vehicles" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
        >
          Vehicles
        </button>
        <button
          onClick={() => setSelectedTab("models")}
          className={`px-4 py-2 ${selectedTab === "models" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
        >
          Models
        </button>
        <button
          onClick={() => setSelectedTab("assignments")}
          className={`px-4 py-2 ${selectedTab === "assignments" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
        >
          Assignments
        </button>
        <button
          onClick={() => setSelectedTab("maintenance")}
          className={`px-4 py-2 ${selectedTab === "maintenance" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
        >
          Maintenance
        </button>
      </div>

      {/* Vehicle Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingVehicle ? "Edit Vehicle" : "New Vehicle"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Model *</label>
                <select
                  name="vehicle_model"
                  required
                  defaultValue={editingVehicle?.vehicle_model_id || ""}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select a model</option>
                  {modelsList.map((model) => (
                    <option key={model.vehicle_model_id} value={model.vehicle_model_id}>
                      {model.year} {model.make} {model.model_name}
                    </option>
                  ))}
                </select>
                {modelsList.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    ⚠️ No models available. Please create a model first in the Models tab.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">VIN *</label>
                <input
                  type="text"
                  name="vin"
                  required
                  maxLength="17"
                  defaultValue={editingVehicle?.vin || ""}
                  placeholder="17-character VIN"
                  className="w-full px-3 py-2 border rounded font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Plate</label>
                <input
                  type="text"
                  name="plate_no"
                  defaultValue={editingVehicle?.license_plate || ""}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Number</label>
                <input
                  type="text"
                  name="unit_no"
                  defaultValue={editingVehicle?.unit_no || ""}
                  placeholder="e.g., TRUCK-101"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  name="status"
                  required
                  defaultValue={editingVehicle?.status || "AVAILABLE"}
                  className="w-full px-3 py-2 border rounded"
                >
                   <option value="AVAILABLE">Available</option>
                   <option value="IN_SERVICE">In Service</option>
                   <option value="MAINTENANCE">Maintenance</option>
                   <option value="OUT_OF_SERVICE">Out of Service</option>
                   <option value="RETIRED">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Odometer</label>
                <input
                  type="number"
                  name="current_odometer"
                  defaultValue={editingVehicle?.current_odometer || ""}
                  placeholder="Miles"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Date</label>
                <input
                  type="date"
                  name="purchased_at"
                  defaultValue={editingVehicle?.purchased_at?.split('T')[0] || ""}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Cost</label>
                <input
                  type="number"
                  step="0.01"
                  name="purchase_cost"
                  defaultValue={editingVehicle?.purchase_cost || ""}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <select
                  name="location"
                  required
                  defaultValue={editingVehicle?.location?.location_id || ""}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select a location</option>
                  {locationsList.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={editingVehicle?.notes || ""}
                  className="w-full px-3 py-2 border rounded"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={modelsList.length === 0}
                >
                  {editingVehicle ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingVehicle(null);
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

      {showModelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingModel ? "Edit Model" : "New Model"}
            </h2>
            <form onSubmit={handleModelSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <input
                  type="number"
                  name="year"
                  defaultValue={editingModel?.year || ""}
                  placeholder="2024"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Make *</label>
                <input
                  type="text"
                  name="make"
                  required
                  defaultValue={editingModel?.make || ""}
                  placeholder="Ford"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model *</label>
                <input
                  type="text"
                  name="model"
                  required
                  defaultValue={editingModel?.model || ""}
                  placeholder="F-150"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingModel?.description || ""}
                  placeholder="Optional notes"
                  rows="2"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editingModel ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModelForm(false);
                    setEditingModel(null);
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

      {/* Vehicles List */}
      {selectedTab === "vehicles" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingVehicles ? (
            <div className="p-6">Loading vehicles...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Unit #</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Vehicle</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">VIN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">License</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Odometer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Assigned To</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  
                  

                </tr>
              </thead>
              <tbody className="divide-y">
                {(vehiclesData?.results || []).map((vehicle) => (
                  <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold">{vehicle.unit_no || "—"}</td>
                   
                    <td className="px-4 py-3 text-sm">{vehicle.model_name || "—"}</td>
                    <td className="px-4 py-3 text-sm font-mono">{vehicle.vin}</td>
                    <td className="px-4 py-3 text-sm">{vehicle.plate_no || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[vehicle.status]}`}>
                        {vehicle.status}
                         </span>

                    </td>
                    <td className="px-4 py-3 text-sm">{vehicle.current_odometer?.toLocaleString() || "—"} mi</td>
                    <td className="px-4 py-3 text-sm">{vehicle.location_name || "—"}</td>                                       

                    <td className="px-4 py-3 text-sm">{vehicle.assigned_to || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => {
                          setEditingVehicle(vehicle);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete vehicle ${vehicle.unit_no || vehicle.vin}?`)) {
                            deleteMutation.mutate(vehicle.vehicle_id);
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
          )}
        </div>
      )}

      {/* ✨ ENHANCED: Models List with CRUD */}
      {selectedTab === "models" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Vehicle Models</h2>
          {loadingModels ? (
            <p>Loading models...</p>
          ) : modelsList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No vehicle models yet.</p>
              <p className="text-sm">Create a model first before adding vehicles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelsList.map((model) => (
                <div key={model.vehicle_model_id} className="border rounded p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">
                        {model.year} {model.make}
                      </h3>
                      <p className="text-sm text-gray-600">{model.model_name}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingModel(model);
                          setShowModelForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete model "${model.year} ${model.make} ${model.model_name}"?`)) {
                            deleteModelMutation.mutate(model.vehicle_model_id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {model.trim_level && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Trim:</strong> {model.trim_level}
                    </p>
                  )}
                  {model.body_style && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Body:</strong> {model.body_style}
                    </p>
                  )}
                  {model.engine && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Engine:</strong> {model.engine}
                    </p>
                  )}
                  {model.fuel_type && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Fuel:</strong> {model.fuel_type}
                    </p>
                  )}
                  {model.default_service_interval_miles && (
                    <p className="text-xs text-gray-500 mt-2">
                      Service: Every {model.default_service_interval_miles.toLocaleString()} miles
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments & Maintenance tabs - placeholder */}
      {(selectedTab === "assignments" || selectedTab === "maintenance") && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">
            {selectedTab === "assignments" ? "Vehicle Assignments" : "Maintenance Records"}
          </h2>
          <p className="text-gray-600">Coming soon...</p>
        </div>
      )}

      {/* Pagination */}
      {selectedTab === "vehicles" && vehiclesData && (
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!vehiclesData?.previous}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!vehiclesData?.next}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}