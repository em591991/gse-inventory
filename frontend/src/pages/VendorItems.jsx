import { useState } from "react";
import axiosClient from "../api/axiosClient";
import VendorItemForm from "../components/VendorItemForm";
import { useVendorItems } from "../hooks/useVendorItems";

function VendorItems() {
  // --------------------
  // State
  // --------------------
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState(null);

  // React Query hook
  const { data, isLoading, error, refetch } = useVendorItems(page, search);

  // --------------------
  // Handlers
  // --------------------
  const handleEdit = (item) => setEditingItem(item);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vendor pricing entry?")) return;
    try {
      await axiosClient.delete(`vendoritems/${id}/`);
      refetch();
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err);
    }
  };

  // --------------------
  // Data handling
  // --------------------
  if (isLoading) return <p className="p-6">Loading Vendor Pricing...</p>;
  if (error) return <p className="p-6 text-red-600">Error loading Vendor Pricing.</p>;

  // For paginated API responses
  const items = data?.results || [];

  console.log("Rendering VendorItems page with data:", data);

  // --------------------
  // Render
  // --------------------
  return (
    <div className="p-6 space-y-6">
      {/* ✅ Create/Edit Form */}
      <VendorItemForm
        onSuccess={refetch}
        editingItem={editingItem}
        clearEdit={() => setEditingItem(null)}
      />

      {/* 🔍 Search & Pagination Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search Vendor or Item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && refetch()}
            className="border rounded-lg p-2 w-64"
          />
          <button
            onClick={() => {
              window.open("http://127.0.0.1:8000/api/vendoritems/export/", "_blank");
            }}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>

        <div className="space-x-2">
          <button
            disabled={!data?.previous}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Prev
          </button>
          <button
            disabled={!data?.next}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>


      {/* 🧾 Vendor Items Table */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border text-left">Vendor</th>
            <th className="p-2 border text-left">Item</th>
            <th className="p-2 border text-left">Price</th>
            <th className="p-2 border text-left">UoM</th>
            <th className="p-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-500">
                No vendor pricing found. Import vendor pricing to get started.
              </td>
            </tr>
          ) : (
            items.map((vi) => (
              <tr key={vi.id}>
                <td className="border p-2">{vi.vendor_name}</td>
                <td className="border p-2">{vi.item_name}</td>
                <td className="border p-2">{vi.price}</td>
                <td className="border p-2">{vi.vendor_uom}</td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    onClick={() => handleEdit(vi)}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(vi.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default VendorItems;
