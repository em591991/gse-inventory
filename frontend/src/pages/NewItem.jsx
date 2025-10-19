import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function NewItem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    manufacturer: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    api
      .post("items/", formData)
      .then((res) => {
        console.log("Item created:", res.data);
        alert("✅ Item added successfully!");
        navigate("/items"); // go back to list
      })
      .catch((err) => {
        console.error("Error creating item:", err);
        alert("❌ Something went wrong while adding the item.");
      });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Add New Item</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
        <input name="name" placeholder="Item Name" value={formData.name} onChange={handleChange} required />
        <input name="sku" placeholder="SKU" value={formData.sku} onChange={handleChange} />
        <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} />
        <input name="manufacturer" placeholder="Manufacturer" value={formData.manufacturer} onChange={handleChange} />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
        <button type="submit">Save Item</button>
      </form>
    </div>
  );
}

export default NewItem;
