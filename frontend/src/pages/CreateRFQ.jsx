// frontend/src/pages/CreateRFQ.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRFQ } from '../services/rfqService';
import { fetchItems } from '../services/api';
import { fetchVendors } from '../services/vendorService';

export default function CreateRFQ() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [rfqNumber, setRfqNumber] = useState('');
  const [description, setDescription] = useState('');
  const [quoteDeadline, setQuoteDeadline] = useState('');

  // Items and vendors
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);

  // RFQ lines
  const [rfqLines, setRfqLines] = useState([
    { item: '', qty_requested: '', uom: '', notes: '' }
  ]);

  useEffect(() => {
    loadData();
    generateRFQNumber();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, vendorsData] = await Promise.all([
        fetchItems(),
        fetchVendors()
      ]);
      setItems(itemsData);
      setVendors(vendorsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load items and vendors');
    }
  };

  const generateRFQNumber = () => {
    const year = new Date().getFullYear();
    const quarter = Math.floor((new Date().getMonth() / 3)) + 1;
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setRfqNumber(`RFQ-${year}-Q${quarter}-${random}`);
  };

  const handleAddLine = () => {
    setRfqLines([...rfqLines, { item: '', qty_requested: '', uom: '', notes: '' }]);
  };

  const handleRemoveLine = (index) => {
    if (rfqLines.length > 1) {
      setRfqLines(rfqLines.filter((_, i) => i !== index));
    }
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...rfqLines];
    updatedLines[index][field] = value;

    // Auto-populate UOM when item is selected
    if (field === 'item' && value) {
      const selectedItem = items.find(item => item.item_id === value);
      if (selectedItem && selectedItem.primary_uom) {
        updatedLines[index].uom = selectedItem.primary_uom;
      }
    }

    setRfqLines(updatedLines);
  };

  const handleVendorToggle = (vendorId) => {
    if (selectedVendors.includes(vendorId)) {
      setSelectedVendors(selectedVendors.filter(id => id !== vendorId));
    } else {
      setSelectedVendors([...selectedVendors, vendorId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (rfqLines.length === 0 || !rfqLines[0].item) {
      setError('Please add at least one item');
      return;
    }

    if (selectedVendors.length === 0) {
      setError('Please select at least one vendor');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare RFQ data
      const rfqData = {
        rfq_number: rfqNumber,
        description: description,
        status: 'DRAFT',
        quote_deadline: quoteDeadline || null,
        lines: rfqLines
          .filter(line => line.item && line.qty_requested)
          .map(line => ({
            item: line.item,
            qty_requested: parseFloat(line.qty_requested),
            uom: line.uom,
            notes: line.notes
          })),
        vendor_ids: selectedVendors
      };

      const createdRFQ = await createRFQ(rfqData);

      // Navigate to the created RFQ
      navigate(`/rfqs/${createdRFQ.rfq_id}`);
    } catch (err) {
      console.error('Error creating RFQ:', err);
      setError(err.response?.data?.detail || 'Failed to create RFQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create Request for Quote</h1>
          <p className="text-gray-600 mt-1">Request quotes from multiple vendors</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* RFQ Header Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">RFQ Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  RFQ Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rfqNumber}
                  onChange={(e) => setRfqNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quote Deadline</label>
                <input
                  type="date"
                  value={quoteDeadline}
                  onChange={(e) => setQuoteDeadline(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., January 2025 Replenishment"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* RFQ Lines */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Items Requested</h2>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 shadow-md transition-colors"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-4">
              {rfqLines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-start p-4 bg-gray-50 rounded-lg">
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-sm font-medium mb-1">
                      Item <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={line.item}
                      onChange={(e) => handleLineChange(index, 'item', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="">Select Item...</option>
                      {items.map(item => (
                        <option key={item.item_id} value={item.item_id}>
                          {item.g_code} - {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={line.qty_requested}
                      onChange={(e) => handleLineChange(index, 'qty_requested', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      UOM <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={line.uom}
                      onChange={(e) => handleLineChange(index, 'uom', e.target.value)}
                      placeholder="EA, FT, etc."
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div className="col-span-11 md:col-span-3">
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <input
                      type="text"
                      value={line.notes}
                      onChange={(e) => handleLineChange(index, 'notes', e.target.value)}
                      placeholder="Special requirements..."
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      disabled={rfqLines.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Selection */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Select Vendors <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose vendors to receive this RFQ
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {vendors.map(vendor => (
                <label
                  key={vendor.vendor_id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    selectedVendors.includes(vendor.vendor_id)
                      ? 'bg-emerald-50 border-emerald-600'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedVendors.includes(vendor.vendor_id)}
                    onChange={() => handleVendorToggle(vendor.vendor_id)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">{vendor.name}</div>
                    {vendor.email && (
                      <div className="text-xs text-gray-500">{vendor.email}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {selectedVendors.length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                {selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/rfqs')}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 shadow-md disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create RFQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
