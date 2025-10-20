import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";

export default function Equipment() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showModelForm, setShowModelForm] = useState(false); // ✨ NEW
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [editingModel, setEditingModel] = useState(null); // ✨ NEW
  const [selectedTab, setSelectedTab] = useState("equipment");

  // Fetch equipment
  const { data: equipmentData, isLoading: loadingEquipment } = useQuery({
    queryKey: ["equipment", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page, search });
      const response = await axiosClient.get(`/equipment/equipment/?${params}`);
      return response.data;
    },
    enabled: selectedTab === "equipment",
  });

  // Fetch equipment models
  const { data: modelsData, isLoading: loadingModels } = useQuery({
    queryKey: ["equipment-models"],
    queryFn: async () => {
      const response = await axiosClient.get("/equipment/models/");
      return response.data;
    },
  });

  // Create/Update equipment mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingEquipment) {
        return axiosClient.put(`/equipment/equipment/${editingEquipment.equipment_id}/`, data);
      }
      return axiosClient.post("/equipment/equipment/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["equipment"]);
      setShowForm(false);
      setEditingEquipment(null);
    },
  });

  // Create/Update model mutation ✨ NEW
  const saveModelMutation = useMutation({
    mutationFn: async (data) => {
      if (editingModel) {
        return axiosClient.put(`/equipment/models/${editingModel.equipment_model_id}/`, data);
      }
      return axiosClient.post("/equipment/models/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["equipment-models"]);
      setShowModelForm(false);
      setEditingModel(null);
    },
  });

  // Delete equipment mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => axiosClient.delete(`/equipment/equipment/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(["equipment"]);
    },
  });

  // Delete model mutation ✨ NEW
  const deleteModelMutation = useMutation({
    mutationFn: (id) => axiosClient.delete(`/equipment/models/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(["equipment-models"]);
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
    IN_STOCK: "bg-green-100 text-green-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    MAINTENANCE: "bg-yellow-100 text-yellow-800",
    RETIRED: "bg-gray-100 text-gray-800",
    LOST: "bg-red-100 text-red-800",
  };

  // Get model list for dropdown
  const modelsList = Array.isArray(modelsData) ? modelsData : (modelsData?.results || []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Equipment Management</h1>
        <div className="flex gap-2">
          {selectedTab === "equipment" && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingEquipment(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + New Equipment
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
          onClick={() => setSelectedTab("equipment")}
          className={`px-4 py-2 ${selectedTab === "equipment" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
        >
          Equipment
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

      {/* Equipment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingEquipment ? "Edit Equipment" : "New Equipment"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Equipment Model *</label>
                <select
                  name="equipment_model"
                  required
                  defaultValue={editingEquipment?.equipment_model_id || ""}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select a model</option>
                  {modelsList.map((model) => (
                    <option key={model.equipment_model_id} value={model.equipment_model_id}>
                      {model.name} - {model.manufacturer}
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
                <label className="block text-sm font-medium mb-1">Serial Number</label>
                <input
                  type="text"
                  name="serial_no"
                  defaultValue={editingEquipment?.serial_no || ""}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Asset Tag</label>
                <input
                  type="text"
                  name="asset_tag"
                  defaultValue={editingEquipment?.asset_tag || ""}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  name="status"
                  required
                  defaultValue={editingEquipment?.status || "IN_STOCK"}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="IN_STOCK">In Stock</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="LOST">Lost</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Date</label>
                <input
                  type="date"
                  name="purchased_at"
                  defaultValue={editingEquipment?.purchased_at?.split('T')[0] || ""}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Cost</label>
                <input
                  type="number"
                  step="0.01"
                  name="purchase_cost"
                  defaultValue={editingEquipment?.purchase_cost || ""}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={editingEquipment?.notes || ""}
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
                  {editingEquipment ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEquipment(null);
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

      {/* ✨ NEW: Equipment Model Form Modal */}
      {showModelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingModel ? "Edit Equipment Model" : "New Equipment Model"}
            </h2>
            <form onSubmit={handleModelSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingModel?.name || ""}
                  placeholder="e.g., Laser Level"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  defaultValue={editingModel?.manufacturer || ""}
                  placeholder="e.g., Bosch, DeWalt"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model Number</label>
                <input
                  type="text"
                  name="model_no"
                  defaultValue={editingModel?.model_no || ""}
                  placeholder="e.g., GLL 30"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingModel?.description || ""}
                  placeholder="Brief description of the equipment type"
                  className="w-full px-3 py-2 border rounded"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Service Interval (days)</label>
                <input
                  type="number"
                  name="default_service_interval_days"
                  defaultValue={editingModel?.default_service_interval_days || ""}
                  placeholder="e.g., 180"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editingModel ? "Update Model" : "Create Model"}
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

      {/* Equipment List */}
      {selectedTab === "equipment" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingEquipment ? (
            <div className="p-6">Loading equipment...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Serial #</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Asset Tag</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(equipmentData?.results || []).map((equip) => (
                  <tr key={equip.equipment_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{equip.serial_no || "—"}</td>
                    <td className="px-4 py-3 text-sm">{equip.asset_tag || "—"}</td>
                    <td className="px-4 py-3 text-sm">{equip.equipment_model?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[equip.status]}`}>
                        {equip.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{equip.current_location?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => {
                          setEditingEquipment(equip);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this equipment?")) {
                            deleteMutation.mutate(equip.equipment_id);
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
          <h2 className="text-xl font-bold mb-4">Equipment Models</h2>
          {loadingModels ? (
            <p>Loading models...</p>
          ) : modelsList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No equipment models yet.</p>
              <p className="text-sm">Create a model first before adding equipment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelsList.map((model) => (
                <div key={model.equipment_model_id} className="border rounded p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{model.name}</h3>
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
                          if (window.confirm(`Delete model "${model.name}"?`)) {
                            deleteModelMutation.mutate(model.equipment_model_id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Manufacturer:</strong> {model.manufacturer || "—"}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Model #:</strong> {model.model_no || "—"}
                  </p>
                  {model.description && (
                    <p className="text-sm text-gray-500 mt-2">{model.description}</p>
                  )}
                  {model.default_service_interval_days && (
                    <p className="text-xs text-gray-500 mt-2">
                      Service: Every {model.default_service_interval_days} days
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
            {selectedTab === "assignments" ? "Equipment Assignments" : "Maintenance Records"}
          </h2>
          <p className="text-gray-600">Coming soon...</p>
        </div>
      )}

      {/* Pagination */}
      {selectedTab === "equipment" && equipmentData && (
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!equipmentData?.previous}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!equipmentData?.next}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}