import { useState } from "react";
import { useEffect } from "react";
import axiosClient from "../api/axiosClient";

function VendorItemForm({ onSuccess, editingItem, clearEdit }) {
  const [formData, setFormData] = useState({
    vendor: "",
    item: "",
    vendor_uom: "",
    price: "",
    conversion_factor: 1,
    lead_time_days: "",
  });

  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch dropdown data on mount
  useState(() => {
    axiosClient.get("vendors/").then((res) => {
      const vendorData = Array.isArray(res.data) ? res.data : res.data.results || [];
      setVendors(vendorData);
    });
    axiosClient.get("items/").then((res) => {
      const itemData = Array.isArray(res.data) ? res.data : res.data.results || [];
      setItems(itemData);
    });
  }, []);

  // Prefill the form when editingItem changes
  useEffect(() => {
    if (editingItem) setFormData(editingItem);
  }, [editingItem]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await axiosClient.put(`vendoritems/${editingItem.id}/`, formData);
      } else {
        await axiosClient.post("vendoritems/", formData);
      }
      onSuccess?.();
      clearEdit?.();
      setFormData({
        vendor: "",
        item: "",
        vendor_uom: "",
        price: "",
        conversion_factor: 1,
        lead_time_days: "",
      });
    } catch (err) {
      console.error("Error saving Vendor Item:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-2xl p-6 space-y-4 border border-gray-200"
    >
      <h2 className="text-xl font-semibold text-gray-800">Create Vendor Item</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Vendor</label>
          <select
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
            required
          >
            <option value="">Select Vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Item</label>
          <select
            name="item"
            value={formData.item}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
            required
          >
            <option value="">Select Item</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Vendor UoM</label>
          <input
            type="text"
            name="vendor_uom"
            value={formData.vendor_uom}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Price</label>
          <input
            type="number"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Conversion Factor</label>
          <input
            type="number"
            step="0.0001"
            name="conversion_factor"
            value={formData.conversion_factor}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Lead Time (days)</label>
          <input
            type="number"
            name="lead_time_days"
            value={formData.lead_time_days}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
      >
        {loading ? "Saving..." : "Save Vendor Item"}
      </button>
    </form>
  );
}

export default VendorItemForm;
