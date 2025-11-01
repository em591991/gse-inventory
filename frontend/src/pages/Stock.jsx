import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function Stock() {
  const [stockLevels, setStockLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [locations, setLocations] = useState([]);

  const fetchStockLevels = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("stock-levels/");
      setStockLevels(response.data);

      // Extract unique locations for filter
      const uniqueLocations = [...new Set(response.data.map(stock => stock.location_name).filter(Boolean))];
      setLocations(uniqueLocations);

      setError("");
    } catch (err) {
      setError("Failed to load stock levels: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockLevels();
  }, []);

  // Filter stock based on search and location
  const filteredStock = stockLevels.filter(stock => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      stock.g_code?.toLowerCase().includes(searchLower) ||
      stock.item_name?.toLowerCase().includes(searchLower) ||
      stock.category?.toLowerCase().includes(searchLower) ||
      stock.manufacturer?.toLowerCase().includes(searchLower);

    const matchesLocation = !locationFilter || stock.location_name === locationFilter;

    return matchesSearch && matchesLocation;
  });

  // Calculate totals
  const totalValue = filteredStock.reduce((sum, stock) => {
    const value = parseFloat(stock.total_value || 0);
    return sum + value;
  }, 0);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-8">Loading stock levels...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-10 bg-gray-50 pb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 pt-2">Stock Levels</h1>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-4 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by item, G-code, category, manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-64">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>{filteredStock.length}</strong> items in stock
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              Total Value: <strong>${totalValue.toFixed(2)}</strong>
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              <strong>{locations.length}</strong> locations
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Stock Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
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
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Bin
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Qty On Hand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  UOM
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Avg Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No stock found. {searchTerm || locationFilter ? "Try adjusting your filters." : "No inventory movements recorded yet."}
                  </td>
                </tr>
              ) : (
                filteredStock.map((stock, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {stock.g_code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {stock.item_name}
                      </div>
                      {stock.category && (
                        <div className="text-xs text-gray-500 mt-1">
                          {stock.category}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stock.location_name || <span className="text-gray-400 italic">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stock.bin_code || <span className="text-gray-400 italic">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${
                        stock.qty_on_hand < 0 ? 'text-red-600' :
                        stock.qty_on_hand === 0 ? 'text-gray-400' :
                        'text-gray-900'
                      }`}>
                        {parseFloat(stock.qty_on_hand).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stock.uom || <span className="text-gray-400 italic">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {stock.avg_cost ? `$${parseFloat(stock.avg_cost).toFixed(2)}` : <span className="text-gray-400 italic">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-green-600">
                        {stock.total_value ? `$${parseFloat(stock.total_value).toFixed(2)}` : <span className="text-gray-400 italic">—</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-gray-100 border border-gray-300 rounded p-4">
        <h3 className="font-semibold text-gray-700 mb-2">About Stock Levels</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Stock levels are calculated from <strong>Inventory Movements</strong></li>
          <li>• Quantities shown are real-time based on all recorded transactions</li>
          <li>• <strong>Negative quantities</strong> indicate items issued but not received (backorder/allocation)</li>
          <li>• Use <strong>Shipments</strong> to receive inventory from purchase orders</li>
          <li>• Use <strong>Adjustments</strong> to correct counts from physical inventory</li>
        </ul>
      </div>
    </div>
  );
}
