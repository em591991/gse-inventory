import { useState } from "react";
import api from "../services/api"; // your Axios instance

function AddItemForm({ onItemAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    manufacturer: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("items/", formData);
      onItemAdded(response.data); // tell parent list to refresh
      setFormData({ name: "", sku: "", category: "", manufacturer: "" });
    } catch (err) {
      setError("Error adding item. Check your backend connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border p-4 rounded-md">
      <h2 className="text-lg font-semibold">Add New Item</h2>

      {error && <p className="text-red-600">{error}</p>}

      <label className="label" htmlFor="name">Item Name</label>
      <input
        id="name"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Item Name"
        className="input"
        required
      />
      <label className="label" htmlFor="sku">SKU</label>
      <input
        id="sku"
        type="text"
        name="sku"
        value={formData.sku}
        onChange={handleChange}
        placeholder="SKU"
        className="input"
      />
      <label className="label" htmlFor="category">Category</label>
      <input
        id="category"
        type="text"
        name="category"
        value={formData.category}
        onChange={handleChange}
        placeholder="Category"
        className="input"
      />
      
      <label className="label" htmlFor="manufacturer">Manufacturer</label>
      <input
        id="manufacturer"
        type="text"
        name="manufacturer"
        value={formData.manufacturer}
        onChange={handleChange}
        placeholder="Manufacturer"
        className="input"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-gseblue text-white px-4 py-2 rounded hover:bg-gselightblue disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Item"}
      </button>
    </form>
  );
}

export default AddItemForm;
