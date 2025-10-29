// frontend/src/pages/ReplenishmentView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchRFQById,
  fetchReplenishmentData,
  createReplenishmentWithLines,
  finalizeReplenishment
} from '../services/rfqService';

export default function ReplenishmentView() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [replenishmentData, setReplenishmentData] = useState([]);

  // Selection state: { rfq_line_id: quote_id }
  const [selections, setSelections] = useState({});

  // Quantity to order state: { rfq_line_id: qty }
  const [quantities, setQuantities] = useState({});

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [rfqId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rfqData, replData] = await Promise.all([
        fetchRFQById(rfqId),
        fetchReplenishmentData(rfqId)
      ]);

      setRfq(rfqData);
      setReplenishmentData(replData);

      // Initialize quantities with requested amounts
      const initialQty = {};
      replData.forEach(line => {
        initialQty[line.rfq_line_id] = line.qty_requested;
      });
      setQuantities(initialQty);

    } catch (err) {
      console.error('Error loading replenishment data:', err);
      setError('Failed to load replenishment data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuote = (rfqLineId, quoteId) => {
    setSelections(prev => ({ ...prev, [rfqLineId]: quoteId }));
  };

  const handleQuantityChange = (rfqLineId, value) => {
    setQuantities(prev => ({ ...prev, [rfqLineId]: parseFloat(value) || 0 }));
  };

  const handleAutoSelectLowestCost = () => {
    const newSelections = {};

    replenishmentData.forEach(line => {
      if (line.quotes.length === 0) return;

      // Find quote with lowest price
      const lowestQuote = line.quotes.reduce((lowest, quote) => {
        return quote.price_each < lowest.price_each ? quote : lowest;
      });

      newSelections[line.rfq_line_id] = lowestQuote.quote_id;
    });

    setSelections(newSelections);
  };

  const handleAutoSelectBestAvailability = () => {
    const newSelections = {};

    replenishmentData.forEach(line => {
      if (line.quotes.length === 0) return;

      const qtyNeeded = quantities[line.rfq_line_id] || line.qty_requested;

      // First, try to find a quote that can fulfill the full quantity
      const fullFulfillment = line.quotes.filter(q => q.qty_available >= qtyNeeded);

      if (fullFulfillment.length > 0) {
        // Among full fulfillment options, pick lowest price
        const best = fullFulfillment.reduce((lowest, quote) => {
          return quote.price_each < lowest.price_each ? quote : lowest;
        });
        newSelections[line.rfq_line_id] = best.quote_id;
      } else {
        // Otherwise, pick the quote with highest availability
        const best = line.quotes.reduce((highest, quote) => {
          return quote.qty_available > highest.qty_available ? quote : highest;
        });
        newSelections[line.rfq_line_id] = best.quote_id;
      }
    });

    setSelections(newSelections);
  };

  const handleCreateReplenishment = async () => {
    // Validate selections
    const missingSelections = replenishmentData.filter(
      line => line.quotes.length > 0 && !selections[line.rfq_line_id]
    );

    if (missingSelections.length > 0) {
      alert(`Please select a vendor for all items with quotes (${missingSelections.length} missing)`);
      return;
    }

    if (!confirm('Create replenishment and generate purchase orders?')) {
      return;
    }

    try {
      setCreating(true);

      // Build replenishment lines
      const lines = Object.entries(selections).map(([rfqLineId, quoteId]) => ({
        rfq_line: rfqLineId,
        selected_vendor_quote: quoteId,
        qty_to_order: quantities[rfqLineId]
      }));

      // Create replenishment with lines
      const replenishment = await createReplenishmentWithLines({
        rfq: rfqId,
        lines: lines
      });

      // Finalize to create POs
      await finalizeReplenishment(replenishment.replenishment_id);

      alert('Purchase orders created successfully!');
      navigate(`/rfqs/${rfqId}`);

    } catch (err) {
      console.error('Error creating replenishment:', err);
      alert('Failed to create replenishment: ' + (err.response?.data?.detail || err.message));
    } finally {
      setCreating(false);
    }
  };

  const getSelectedQuote = (lineId) => {
    const selectedQuoteId = selections[lineId];
    if (!selectedQuoteId) return null;

    const line = replenishmentData.find(l => l.rfq_line_id === lineId);
    return line?.quotes.find(q => q.quote_id === selectedQuoteId);
  };

  const calculateTotalCost = () => {
    let total = 0;
    Object.entries(selections).forEach(([lineId, quoteId]) => {
      const line = replenishmentData.find(l => l.rfq_line_id === lineId);
      const quote = line?.quotes.find(q => q.quote_id === quoteId);
      if (quote) {
        const qty = quantities[lineId] || 0;
        total += quote.price_each * qty;
      }
    });
    return total;
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="text-gray-600">Loading replenishment data...</div>
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
            onClick={() => navigate(`/rfqs/${rfqId}`)}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Back to RFQ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Replenishment Analysis</h1>
            <p className="text-gray-600 mt-1">
              RFQ: {rfq.rfq_number} - {rfq.description}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAutoSelectLowestCost}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-md transition-colors"
            >
              Auto: Lowest Cost
            </button>
            <button
              onClick={handleAutoSelectBestAvailability}
              className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 shadow-md transition-colors"
            >
              Auto: Best Availability
            </button>
            <button
              onClick={() => navigate(`/rfqs/${rfqId}`)}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to RFQ
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-500">Total Items</div>
              <div className="text-2xl font-bold text-gray-800">{replenishmentData.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Items with Quotes</div>
              <div className="text-2xl font-bold text-emerald-600">
                {replenishmentData.filter(l => l.quotes.length > 0).length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Selections Made</div>
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(selections).length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Estimated Total</div>
              <div className="text-2xl font-bold text-gray-800">
                ${calculateTotalCost().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Replenishment Grid */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                    Item
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                    Qty Needed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="100">
                    Vendor Quotes (click to select)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {replenishmentData.map(line => {
                  const selectedQuote = getSelectedQuote(line.rfq_line_id);

                  return (
                    <tr key={line.rfq_line_id} className="hover:bg-gray-50">
                      {/* Item Info */}
                      <td className="px-4 py-4 border-r bg-gray-50">
                        <div className="text-sm font-medium text-gray-900">{line.item.name}</div>
                        <div className="text-xs text-gray-500">{line.item.g_code}</div>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-4 border-r bg-gray-50">
                        <input
                          type="number"
                          step="0.01"
                          value={quantities[line.rfq_line_id] || ''}
                          onChange={(e) => handleQuantityChange(line.rfq_line_id, e.target.value)}
                          className="w-24 px-2 py-1 text-sm border rounded text-center"
                        />
                        <div className="text-xs text-gray-500 mt-1">{line.uom}</div>
                      </td>

                      {/* Quotes */}
                      {line.quotes.length > 0 ? (
                        line.quotes.map(quote => {
                          const isSelected = selections[line.rfq_line_id] === quote.quote_id;
                          const qtyNeeded = quantities[line.rfq_line_id] || line.qty_requested;
                          const canFulfill = quote.qty_available >= qtyNeeded;

                          return (
                            <td
                              key={quote.quote_id}
                              className={`px-4 py-4 cursor-pointer border-r transition-colors ${
                                isSelected
                                  ? 'bg-emerald-100 border-emerald-500 border-2'
                                  : 'hover:bg-blue-50'
                              }`}
                              onClick={() => handleSelectQuote(line.rfq_line_id, quote.quote_id)}
                            >
                              <div className="min-w-[180px]">
                                <div className="font-semibold text-gray-900">{quote.vendor.name}</div>
                                <div className="text-lg font-bold text-emerald-600 mt-1">
                                  ${parseFloat(quote.price_each).toFixed(2)} / {line.uom}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <div className={canFulfill ? 'text-emerald-600' : 'text-orange-600'}>
                                    Avail: {parseFloat(quote.qty_available).toLocaleString()} {line.uom}
                                  </div>
                                  {quote.lead_time_days > 0 && (
                                    <div>Lead: {quote.lead_time_days} days</div>
                                  )}
                                  {quote.manufacturer && (
                                    <div className="text-xs mt-1 text-gray-500">
                                      {quote.manufacturer}
                                      {quote.manufacturer_part_number && ` #${quote.manufacturer_part_number}`}
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="mt-2 text-sm font-medium text-emerald-700">
                                    ✓ Selected - Total: ${(quote.price_each * qtyNeeded).toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })
                      ) : (
                        <td className="px-4 py-4 text-sm text-gray-500 italic" colSpan="100">
                          No quotes received
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-gray-800">
              Ready to create purchase orders?
            </div>
            <button
              onClick={handleCreateReplenishment}
              disabled={creating || Object.keys(selections).length === 0}
              className="px-8 py-3 bg-emerald-600 text-white text-lg font-medium rounded-md hover:bg-emerald-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? 'Creating...' : 'Create Purchase Orders'}
            </button>
          </div>
          {Object.keys(selections).length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              {Object.keys(selections).length} items selected •
              Estimated total: ${calculateTotalCost().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
