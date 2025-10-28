// frontend/src/pages/RFQs.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchRFQs } from '../services/rfqService';

export default function RFQs() {
  const navigate = useNavigate();
  const [rfqs, setRFQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRFQs();
  }, []);

  const loadRFQs = async () => {
    try {
      setLoading(true);
      const data = await fetchRFQs();
      setRFQs(data);
      setError(null);
    } catch (err) {
      console.error('Error loading RFQs:', err);
      setError('Failed to load RFQs');
    } finally {
      setLoading(false);
    }
  };

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesStatus = !statusFilter || rfq.status === statusFilter;
    const matchesSearch = !searchQuery ||
      rfq.rfq_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rfq.description && rfq.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      QUOTED: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="text-gray-600">Loading RFQs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Requests for Quote (RFQs)</h1>
        <p className="text-gray-600 mt-1">Manage vendor quote requests and replenishment</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              placeholder="RFQ number, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent to Vendors</option>
              <option value="QUOTED">Quotes Received</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-end justify-end">
            <Link
              to="/rfqs/create"
              className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 shadow-md transition-colors whitespace-nowrap"
            >
              + Create RFQ
            </Link>
          </div>
        </div>
      </div>

      {/* RFQs List */}
      {filteredRFQs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-500 mb-4">
            {rfqs.length === 0 ? 'No RFQs yet' : 'No RFQs match your filters'}
          </div>
          {rfqs.length === 0 && (
            <Link
              to="/rfqs/create"
              className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              Create Your First RFQ
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">RFQ Number</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Deadline</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Lines</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Vendors</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Quotes</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRFQs.map((rfq) => (
                <tr key={rfq.rfq_id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">
                    <Link to={`/rfqs/${rfq.rfq_id}`} className="hover:underline">
                      {rfq.rfq_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate" title={rfq.description}>
                    {rfq.description || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}>
                      {rfq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(rfq.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(rfq.quote_deadline)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {rfq.line_count || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {rfq.vendor_count || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {rfq.quote_count || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/rfqs/${rfq.rfq_id}`}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        View
                      </Link>
                      {rfq.status === 'QUOTED' && (
                        <Link
                          to={`/rfqs/${rfq.rfq_id}/replenishment`}
                          className="px-3 py-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          Replenish
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
