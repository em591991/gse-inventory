import React, { useState } from "react";
import axiosClient from "../api/axiosClient";

export default function ItemsBulkUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const response = await axiosClient.post("items-upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Items CSV Upload</h1>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h3 className="font-semibold mb-2">CSV Format Required:</h3>
        <p className="text-sm text-gray-700 mb-2">
          Your CSV should include the following columns:
        </p>
        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
          <li><strong>g_code</strong> (required) - Unique internal SKU</li>
          <li><strong>item_name</strong> (required) - Item name</li>
          <li><strong>description</strong> (optional) - Item description</li>
          <li><strong>category</strong> (optional) - Level 1 category (e.g., Electrical, Plumbing)</li>
          <li><strong>subcategory</strong> (optional) - Level 2 subcategory (e.g., Breakers, Valves)</li>
          <li><strong>subcategory2</strong> (optional) - Level 3 subcategory (e.g., Single Pole, Ball Type)</li>
          <li><strong>subcategory3</strong> (optional) - Level 4 subcategory (e.g., 15-20A Range, Brass)</li>
          <li><strong>manufacturer</strong> (optional) - Manufacturer name (can be empty initially)</li>
          <li><strong>manufacturer_part_no</strong> (optional) - Mfr part number (can be empty initially)</li>
          <li><strong>default_uom</strong> (optional) - Unit of measure (e.g., EA, LB, FT)</li>
        </ul>
        <div className="mt-3 text-sm bg-white p-2 rounded font-mono text-xs overflow-x-auto">
          g_code,item_name,description,category,subcategory,subcategory2,subcategory3,manufacturer,manufacturer_part_no,default_uom
        </div>
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800 font-semibold mb-1">
            Catalog Navigation Example:
          </p>
          <p className="text-xs text-green-700 font-mono">
            Electrical → Breakers → Single Pole → 15-20A Range
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full border border-gray-300 rounded-lg p-2 bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-600 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Upload Summary</h2>
          <div className="space-y-2">
            <p className="text-green-600">✓ Created: {result.created}</p>
            <p className="text-blue-600">↻ Updated: {result.updated}</p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-red-600 mb-2">Errors:</h3>
                <ul className="text-sm text-red-600 space-y-1">
                  {result.errors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
