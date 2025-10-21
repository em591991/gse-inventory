import { useEffect, useState } from "react";
import api from "../services/api";
import AddItemForm from "../components/AddItemForm";

function Items() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    category: "",
    manufacturer: "",
  });

  const fetchItems = async () => {
    const response = await api.get("items/");
    
    // ✅ FIX: Handle paginated response (with 'results' key) or direct array
    const itemList = Array.isArray(response.data) ? response.data : (response.data.results || []);
    
    setItems(itemList);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleItemAdded = (newItem) => {
    setItems((prev) => [...prev, newItem]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    await api.delete(`items/${id}/`);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      sku: item.sku,
      category: item.category,
      manufacturer: item.manufacturer,
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const response = await api.put(`items/${editingId}/`, editForm);
    setItems((prev) =>
      prev.map((item) => (item.id === editingId ? response.data : item))
    );
    setEditingId(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-gseblue">Inventory Items</h1>

      <div className="mb-6">
        <AddItemForm onItemAdded={handleItemAdded} />
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="bg-white shadow-card p-4 rounded-lg"
          >
            {editingId === item.id ? (
              <form onSubmit={handleEditSubmit} className="space-y-2">
                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="border p-1 rounded w-full"
                />
                <input
                  name="sku"
                  value={editForm.sku}
                  onChange={handleEditChange}
                  className="border p-1 rounded w-full"
                />
                <input
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                  className="border p-1 rounded w-full"
                />
                <input
                  name="manufacturer"
                  value={editForm.manufacturer}
                  onChange={handleEditChange}
                  className="border p-1 rounded w-full"
                />

                <div className="space-x-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>

                </div>
              
              </form>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <strong className="text-gseblue">{item.name}</strong>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="btn btn-primary"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Items;