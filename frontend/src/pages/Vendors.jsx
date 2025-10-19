import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [confirmDelete, setConfirmDelete] = useState(null);

  // --- Fetch vendors ---
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/vendors/");
        if (!response.ok) throw new Error(`Failed to fetch vendors: ${response.status}`);
        const data = await response.json();
        setVendors(data);
        setFiltered(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  // --- Search + Sort ---
  useEffect(() => {
    const lower = search.toLowerCase();
    const results = vendors
      .filter(
        (v) =>
          v.name.toLowerCase().includes(lower) ||
          (v.contact_name && v.contact_name.toLowerCase().includes(lower))
      )
      .sort((a, b) => a[sortBy]?.localeCompare(b[sortBy] || ""));
    setFiltered(results);
  }, [search, sortBy, vendors]);

  // --- Handle Add / Edit Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingVendor ? "PUT" : "POST";
    const url = editingVendor
      ? `http://127.0.0.1:8000/api/vendors/${editingVendor.id}/`
      : "http://127.0.0.1:8000/api/vendors/";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save vendor");
      const updated = await res.json();

      if (editingVendor) {
        setVendors((prev) =>
          prev.map((v) => (v.id === updated.id ? updated : v))
        );
      } else {
        setVendors((prev) => [...prev, updated]);
      }

      setShowForm(false);
      setEditingVendor(null);
      resetForm();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Handle Delete ---
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/vendors/${id}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete vendor");
      setVendors((prev) => prev.filter((v) => v.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Form helpers ---
  const resetForm = () =>
    setFormData({
      name: "",
      contact_name: "",
      email: "",
      phone: "",
      address: "",
    });

  const openAddForm = () => {
    resetForm();
    setEditingVendor(null);
    setShowForm(true);
  };

  const openEditForm = (vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setShowForm(true);
  };

  if (loading) return <div className="p-6 text-gray-600">Loading vendors...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Vendors</h1>
        <button
          onClick={openAddForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Vendor
        </button>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-md w-64"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border p-2 rounded-md"
        >
          <option value="name">Sort by Name</option>
          <option value="contact_name">Sort by Contact</option>
        </select>
      </div>

      {/* Vendor Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border-b">Name</th>
              <th className="p-3 border-b">Contact</th>
              <th className="p-3 border-b">Email</th>
              <th className="p-3 border-b">Phone</th>
              <th className="p-3 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="p-3 border-b font-medium">{v.name}</td>
                <td className="p-3 border-b">{v.contact_name || "—"}</td>
                <td className="p-3 border-b">{v.email || "—"}</td>
                <td className="p-3 border-b">{v.phone || "—"}</td>
                <td className="p-3 border-b text-center space-x-2">
                  <Link
                    to={`/vendors/${v.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => openEditForm(v)}
                    className="text-yellow-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(v)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">
              {editingVendor ? "Edit Vendor" : "Add Vendor"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium capitalize mb-1">
                    {key.replace("_", " ")}
                  </label>
                  <input
                    type="text"
                    value={value || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    className="w-full border p-2 rounded-md"
                  />
                </div>
              ))}
              <div className="flex justify-end mt-4 gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <h2 className="text-lg font-semibold mb-3">Delete Vendor?</h2>
            <p className="text-gray-600 mb-5">
              Are you sure you want to delete{" "}
              <strong>{confirmDelete.name}</strong>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vendors;
