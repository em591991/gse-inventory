import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function VendorDetail() {
  const { id } = useParams(); // get vendor ID from the URL
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/vendors/${id}/detail/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch vendor: ${response.status}`);
        }
        const data = await response.json();
        setVendor(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [id]);

  if (loading) return <div className="p-6 text-gray-600">Loading vendor data...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!vendor) return <div className="p-6">Vendor not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{vendor.name}</h1>

      <div className="mb-6 bg-white shadow p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Contact Information</h2>
        <p><strong>Contact:</strong> {vendor.contact_name || "N/A"}</p>
        <p><strong>Email:</strong> {vendor.email || "N/A"}</p>
        <p><strong>Phone:</strong> {vendor.phone || "N/A"}</p>
        <p><strong>Address:</strong> {vendor.address || "N/A"}</p>
      </div>

      <div className="bg-white shadow p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Items from this Vendor</h2>
        {vendor.vendor_items && vendor.vendor_items.length > 0 ? (
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border-b">Item</th>
                <th className="p-2 border-b">Vendor SKU</th>
                <th className="p-2 border-b">Price</th>
                <th className="p-2 border-b">UoM</th>
                <th className="p-2 border-b">Lead Time (days)</th>
              </tr>
            </thead>
            <tbody>
              {vendor.vendor_items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-2 border-b">{item.item_name}</td>
                  <td className="p-2 border-b">{item.vendor_sku || "—"}</td>
                  <td className="p-2 border-b">${item.price}</td>
                  <td className="p-2 border-b">{item.vendor_uom || "—"}</td>
                  <td className="p-2 border-b">{item.lead_time_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">No items available for this vendor.</p>
        )}
      </div>

      <div className="mt-6">
        <Link
          to="/vendors"
          className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
        >
          ← Back to Vendors
        </Link>
      </div>
    </div>
  );
}

export default VendorDetail;
