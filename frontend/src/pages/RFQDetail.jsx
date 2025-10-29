// frontend/src/pages/RFQDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchRFQById,
  sendRFQToVendors,
  fetchRFQVendors,
  fetchRFQQuotes
} from '../services/rfqService';

export default function RFQDetail() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    loadRFQData();
  }, [rfqId]);

  const loadRFQData = async () => {
    try {
      setLoading(true);
      const [rfqData, vendorsData, quotesData] = await Promise.all([
        fetchRFQById(rfqId),
        fetchRFQVendors(rfqId),
        fetchRFQQuotes(rfqId)
      ]);
      setRfq(rfqData);
      setVendors(vendorsData);
      setQuotes(quotesData);
    } catch (err) {
      console.error('Error loading RFQ:', err);
      setError('Failed to load RFQ details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToVendors = async () => {
    if (!confirm('Send this RFQ to all selected vendors?')) return;

    try {
      await sendRFQToVendors(rfqId);
      alert('RFQ sent to vendors successfully');
      loadRFQData(); // Reload to get updated status
    } catch (err) {
      console.error('Error sending RFQ:', err);
      alert('Failed to send RFQ to vendors');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-200 text-gray-700',
      SENT: 'bg-blue-100 text-blue-700',
      QUOTED: 'bg-emerald-100 text-emerald-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-200 text-gray-700';
  };

  const getVendorStatusBadge = (status) => {
    const badges = {
      PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
      QUOTED: { label: 'Quoted', color: 'bg-emerald-100 text-emerald-700' },
      DECLINED: { label: 'Declined', color: 'bg-red-100 text-red-700' },
      NO_RESPONSE: { label: 'No Response', color: 'bg-gray-200 text-gray-600' },
    };
    return badges[status] || badges.PENDING;
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="text-gray-600">Loading RFQ...</div>
        </div>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="text-red-600">{error || 'RFQ not found'}</div>
          <button
            onClick={() => navigate('/rfqs')}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Back to RFQs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-800">{rfq.rfq_number}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(rfq.status)}`}>
                {rfq.status}
              </span>
            </div>
            {rfq.description && (
              <p className="text-gray-600">{rfq.description}</p>
            )}
            <div className="mt-2 text-sm text-gray-500">
              Created {new Date(rfq.created_at).toLocaleDateString()} by {rfq.created_by_name}
              {rfq.sent_at && ` • Sent ${new Date(rfq.sent_at).toLocaleDateString()}`}
            </div>
          </div>
          <div className="flex gap-2">
            {rfq.status === 'DRAFT' && (
              <button
                onClick={handleSendToVendors}
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 shadow-md transition-colors"
              >
                Send to Vendors
              </button>
            )}
            {rfq.status === 'QUOTED' && (
              <button
                onClick={() => navigate(`/rfqs/${rfqId}/replenishment`)}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-md transition-colors"
              >
                Create Replenishment
              </button>
            )}
            <button
              onClick={() => navigate('/rfqs')}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>

        {/* RFQ Lines */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Items Requested</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    G-Code
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UOM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rfq.lines && rfq.lines.length > 0 ? (
                  rfq.lines.map(line => {
                    const lineQuotes = quotes.filter(q => q.rfq_line === line.rfq_line_id);
                    return (
                      <tr key={line.rfq_line_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {line.line_no}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {line.item_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {line.item_g_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {parseFloat(line.qty_requested).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {line.uom_code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {line.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`px-2 py-1 rounded ${
                            lineQuotes.length > 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {lineQuotes.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No items in this RFQ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendors */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Vendors</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responded
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors && vendors.length > 0 ? (
                  vendors.map(vendor => {
                    const vendorQuotes = quotes.filter(q => q.vendor_id === vendor.vendor);
                    const statusBadge = getVendorStatusBadge(vendor.status);
                    return (
                      <tr key={vendor.rfq_vendor_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {vendor.vendor_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {vendor.contact_name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {vendor.contact_email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vendor.sent_at ? new Date(vendor.sent_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vendor.responded_at ? new Date(vendor.responded_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No vendors selected for this RFQ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quotes Summary (if any) */}
        {quotes && quotes.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Quotes Received</h2>
                <button
                  onClick={() => navigate(`/rfqs/${rfqId}/quotes`)}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  View All Quotes
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-sm text-gray-600">
                {quotes.length} quote{quotes.length !== 1 ? 's' : ''} received from{' '}
                {new Set(quotes.map(q => q.vendor_id)).size} vendor{new Set(quotes.map(q => q.vendor_id)).size !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
