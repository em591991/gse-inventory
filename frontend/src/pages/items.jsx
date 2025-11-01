import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

function Items() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);

  // Modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("items/?page_size=10000");
      const itemList = Array.isArray(response.data)
        ? response.data
        : (response.data.results || []);
      setItems(itemList);

      // Extract unique categories for filter
      const uniqueCategories = [...new Set(itemList.map(item => item.category).filter(Boolean))];
      setCategories(uniqueCategories);

      setError("");
    } catch (err) {
      setError("Failed to load items: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await axiosClient.delete(`items/${itemId}/`);
      setItems((prev) => prev.filter((item) => item.item_id !== itemId));
      if (isModalOpen && selectedItem?.item_id === itemId) {
        setIsModalOpen(false);
        setSelectedItem(null);
      }
    } catch (err) {
      alert("Failed to delete item: " + (err.response?.data?.error || err.message));
    }
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setEditedItem({ ...item });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setEditedItem({ ...item });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedItem(null);
    setEditedItem(null);
  };

  const handleSaveItem = async () => {
    try {
      setSaving(true);
      const response = await axiosClient.put(`items/${editedItem.item_id}/`, editedItem);

      // Update items list
      setItems((prev) =>
        prev.map((item) =>
          item.item_id === editedItem.item_id ? response.data : item
        )
      );

      setSelectedItem(response.data);
      setIsEditing(false);
      alert("Item updated successfully!");
    } catch (err) {
      alert("Failed to save item: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedItem((prev) => ({ ...prev, [field]: value }));
  };

  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    // Enhanced search: search across all item fields
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      item.g_code?.toLowerCase().includes(searchLower) ||
      item.item_name?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.manufacturer?.toLowerCase().includes(searchLower) ||
      item.manufacturer_part_no?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.subcategory?.toLowerCase().includes(searchLower) ||
      item.subcategory2?.toLowerCase().includes(searchLower) ||
      item.subcategory3?.toLowerCase().includes(searchLower);

    const matchesCategory = !categoryFilter || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-8">Loading items...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-10 bg-gray-50 pb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 pt-2">Inventory Items Catalog</h1>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-4 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search items (G-code, name, description, manufacturer, category)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-64">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-800">
            Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> items
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  G-Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Category Path
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  UOM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Est. Cost
                </th>
              </tr>
            </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No items found. {searchTerm || categoryFilter ? "Try adjusting your filters." : "Import items to get started."}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                // Build category path
                const categoryPath = [
                  item.category,
                  item.subcategory,
                  item.subcategory2,
                  item.subcategory3
                ].filter(Boolean).join(' → ');

                return (
                  <tr key={item.item_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewItem(item)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {item.g_code}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.item_name}
                      </div>
                      {item.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600">
                        {categoryPath || <span className="text-gray-400 italic">Uncategorized</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.manufacturer || <span className="text-gray-400 italic">—</span>}
                      </div>
                      {item.manufacturer_part_no && (
                        <div className="text-xs text-gray-500">
                          P/N: {item.manufacturer_part_no}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.default_uom || <span className="text-gray-400 italic">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.current_replacement_cost ? (
                        <div>
                          <div className="text-sm font-medium text-green-600">
                            ${parseFloat(item.current_replacement_cost).toFixed(2)}
                          </div>
                          {item.last_cost_update && (
                            <div className="text-xs text-gray-500">
                              {new Date(item.last_cost_update).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-gray-100 border border-gray-300 rounded p-4">
        <h3 className="font-semibold text-gray-700 mb-2">About This Page</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• This is the <strong>Item Master Catalog</strong> - all items that can be stocked</li>
          <li>• <strong>Quantity on hand</strong> is tracked separately per location (see Inventory/Stock Levels page)</li>
          <li>• Import items in bulk via <strong>Admin → Import Hub</strong></li>
          <li>• Category hierarchy supports up to 4 levels for easy catalog navigation</li>
          <li>• Items are linked to vendors through <strong>Vendor Items</strong> page (pricing/sourcing)</li>
          <li>• <strong>Est. Cost</strong> auto-updates from latest PO receipt (used for job quoting)</li>
        </ul>
      </div>

      {/* Item Detail/Edit Modal */}
      {isModalOpen && editedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEditing ? "Edit Item" : "Item Details"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{editedItem.g_code}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Basic Info Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      G-Code <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedItem.g_code || ""}
                        onChange={(e) => handleFieldChange("g_code", e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{editedItem.g_code}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedItem.item_name || ""}
                        onChange={(e) => handleFieldChange("item_name", e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{editedItem.item_name}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedItem.description || ""}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{editedItem.description || "—"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default UOM
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedItem.default_uom || ""}
                        onChange={(e) => handleFieldChange("default_uom", e.target.value)}
                        placeholder="EA, BOX, FT, etc."
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{editedItem.default_uom || "—"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Category Hierarchy</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category (Level 1)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedItem.category || ""}
                        onChange={(e) => handleFieldChange("category", e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{editedItem.category || "—"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory (Level 2)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedItem.subcategory || ""}
                        onChange={(e) => handleFieldChange("subcategory", e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{editedItem.subcategory || "—"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory 2 (Level 3)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedItem.subcategory2 || ""}
                        onChange={(e) => handleFieldChange("subcategory2", e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{editedItem.subcategory2 || "—"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory 3 (Level 4)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedItem.subcategory3 || ""}
                        onChange={(e) => handleFieldChange("subcategory3", e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{editedItem.subcategory3 || "—"}</p>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Full Path:</strong>{" "}
                      {[
                        editedItem.category,
                        editedItem.subcategory,
                        editedItem.subcategory2,
                        editedItem.subcategory3,
                      ]
                        .filter(Boolean)
                        .join(" → ") || "Uncategorized"}
                    </p>
                  </div>
                )}
              </div>

              {/* Manufacturer Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Manufacturer Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedItem.manufacturer || ""}
                        onChange={(e) => handleFieldChange("manufacturer", e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{editedItem.manufacturer || "—"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer Part Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedItem.manufacturer_part_no || ""}
                        onChange={(e) => handleFieldChange("manufacturer_part_no", e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{editedItem.manufacturer_part_no || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
              <div>
                {!isEditing && (
                  <button
                    onClick={() => handleDelete(selectedItem.item_id)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Delete Item
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setEditedItem({ ...selectedItem });
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveItem}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Edit Item
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Items;
