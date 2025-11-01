import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";

export default function AuditLog() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    user: "",
    startDate: "",
    endDate: "",
  });

  // Fetch audit logs
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-logs", page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page });
      if (filters.action) params.append("action", filters.action);
      if (filters.user) params.append("user", filters.user);
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      
      const response = await axiosClient.get(`/audit/logs/?${params}`);
      return response.data;
    },
  });

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
    setPage(1); // Reset to first page on filter change
  };

  const actionColors = {
    CREATE: "bg-green-100 text-green-800",
    UPDATE: "bg-blue-100 text-blue-800",
    DELETE: "bg-red-100 text-red-800",
    VIEW: "bg-gray-100 text-gray-800",
    LOGIN: "bg-purple-100 text-purple-800",
    LOGOUT: "bg-purple-100 text-purple-800",
  };

  if (isLoading) return <div className="p-6">Loading audit logs...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="VIEW">View</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">User</label>
            <input
              type="text"
              name="user"
              value={filters.user}
              onChange={handleFilterChange}
              placeholder="Username or ID"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => {
              setFilters({
                action: "",
                user: "",
                startDate: "",
                endDate: "",
              });
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Timestamp</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Table</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Record ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">IP Address</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.results?.map((log) => (
              <tr key={log.log_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  {log.user_display || log.user || "System"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      actionColors[log.action] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{log.table_name}</td>
                <td className="px-4 py-3 text-sm font-mono text-xs">
                  {log.record_id?.substring(0, 8)}...
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {log.ip_address || "—"}
                </td>
                <td className="px-4 py-3 text-sm">
                  {log.changes ? (
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800">
                        View Changes
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-w-md">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Records</div>
          <div className="text-2xl font-bold">{data?.count || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">This Page</div>
          <div className="text-2xl font-bold">{data?.results?.length || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Current Page</div>
          <div className="text-2xl font-bold">{page}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Filters Active</div>
          <div className="text-2xl font-bold">
            {Object.values(filters).filter((v) => v).length}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!data?.previous}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {Math.ceil((data?.count || 0) / 25)}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!data?.next}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}