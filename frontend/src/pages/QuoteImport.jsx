// frontend/src/pages/QuoteImport.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRFQById } from '../services/rfqService';
import { fetchVendors } from '../services/vendorService';
import { bulkCreateVendorQuotes } from '../services/rfqService';
import Papa from 'papaparse';

export default function QuoteImport() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');

  // CSV parsing state
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [showMapping, setShowMapping] = useState(false);

  // Field mapping state
  const [fieldMapping, setFieldMapping] = useState({
    item_identifier: '', // Can be g_code or item_id
    price_each: '',
    qty_available: '',
    lead_time_days: '',
    manufacturer: '',
    manufacturer_part_number: '',
    notes: '',
  });

  // Preview state
  const [previewData, setPreviewData] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [rfqId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rfqData, vendorsData] = await Promise.all([
        fetchRFQById(rfqId),
        fetchVendors()
      ]);
      setRfq(rfqData);
      setVendors(vendorsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load RFQ and vendor data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvHeaders(results.meta.fields || []);
        setCsvData(results.data);
        setShowMapping(true);
      },
      error: (err) => {
        alert('Error parsing CSV: ' + err.message);
      }
    });
  };

  const handleMappingChange = (field, csvColumn) => {
    setFieldMapping(prev => ({ ...prev, [field]: csvColumn }));
  };

  const handlePreview = () => {
    if (!selectedVendor) {
      alert('Please select a vendor');
      return;
    }

    if (!fieldMapping.item_identifier || !fieldMapping.price_each) {
      alert('Item identifier and price are required fields');
      return;
    }

    const mapped = [];
    const errors = [];

    csvData.forEach((row, index) => {
      const itemIdentifier = row[fieldMapping.item_identifier];
      const priceEach = parseFloat(row[fieldMapping.price_each]);

      if (!itemIdentifier || isNaN(priceEach)) {
        errors.push(`Row ${index + 1}: Missing item or invalid price`);
        return;
      }

      // Find matching RFQ line by g_code or item_id
      const rfqLine = rfq.lines.find(line =>
        line.item_g_code === itemIdentifier || line.item_id === itemIdentifier
      );

      if (!rfqLine) {
        errors.push(`Row ${index + 1}: No matching item for "${itemIdentifier}"`);
        return;
      }

      mapped.push({
        rfq_line: rfqLine.rfq_line_id,
        vendor: selectedVendor,
        price_each: priceEach,
        qty_available: fieldMapping.qty_available
          ? parseFloat(row[fieldMapping.qty_available]) || 0
          : rfqLine.qty_requested,
        lead_time_days: fieldMapping.lead_time_days
          ? parseInt(row[fieldMapping.lead_time_days]) || 0
          : 0,
        manufacturer: fieldMapping.manufacturer
          ? row[fieldMapping.manufacturer] || ''
          : '',
        manufacturer_part_number: fieldMapping.manufacturer_part_number
          ? row[fieldMapping.manufacturer_part_number] || ''
          : '',
        notes: fieldMapping.notes
          ? row[fieldMapping.notes] || ''
          : '',
        // For display only
        _item_name: rfqLine.item_name,
        _item_g_code: rfqLine.item_g_code,
      });
    });

    if (errors.length > 0) {
      alert('Mapping errors:\n' + errors.join('\n'));
    }

    setPreviewData(mapped);
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      alert('No data to import. Please preview first.');
      return;
    }

    if (!confirm(`Import ${previewData.length} quotes for this vendor?`)) {
      return;
    }

    try {
      setImporting(true);

      // Remove display-only fields
      const quotesToImport = previewData.map(({ _item_name, _item_g_code, ...quote }) => quote);

      const result = await bulkCreateVendorQuotes(quotesToImport);

      alert(`Successfully imported ${result.created} quotes`);
      navigate(`/rfqs/${rfqId}`);
    } catch (err) {
      console.error('Error importing quotes:', err);
      alert('Failed to import quotes: ' + (err.response?.data?.detail || err.message));
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="text-red-600">{error || 'RFQ not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Import Vendor Quotes</h1>
          <p className="text-gray-600 mt-1">
            RFQ: {rfq.rfq_number} - {rfq.description}
          </p>
        </div>

        {/* Vendor Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">1. Select Vendor</h2>
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="w-full max-w-md px-3 py-2 border rounded-md"
          >
            <option value="">Choose a vendor...</option>
            {vendors.map(vendor => (
              <option key={vendor.vendor_id} value={vendor.vendor_id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">2. Upload CSV File</h2>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
          {csvFile && (
            <div className="mt-2 text-sm text-gray-600">
              Loaded: {csvFile.name} ({csvData.length} rows)
            </div>
          )}
        </div>

        {/* Field Mapping */}
        {showMapping && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">3. Map CSV Columns</h2>
            <p className="text-sm text-gray-600 mb-4">
              Match your CSV columns to the required fields. Item identifier and price are required.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Item Identifier (G-Code) <span className="text-red-500">*</span>
                </label>
                <select
                  value={fieldMapping.item_identifier}
                  onChange={(e) => handleMappingChange('item_identifier', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Price Each <span className="text-red-500">*</span>
                </label>
                <select
                  value={fieldMapping.price_each}
                  onChange={(e) => handleMappingChange('price_each', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity Available</label>
                <select
                  value={fieldMapping.qty_available}
                  onChange={(e) => handleMappingChange('qty_available', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lead Time (days)</label>
                <select
                  value={fieldMapping.lead_time_days}
                  onChange={(e) => handleMappingChange('lead_time_days', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manufacturer</label>
                <select
                  value={fieldMapping.manufacturer}
                  onChange={(e) => handleMappingChange('manufacturer', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manufacturer Part #</label>
                <select
                  value={fieldMapping.manufacturer_part_number}
                  onChange={(e) => handleMappingChange('manufacturer_part_number', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handlePreview}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-md transition-colors"
              >
                Preview Import
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {previewData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">4. Preview & Import</h2>
              <p className="text-sm text-gray-600">
                {previewData.length} quotes ready to import
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">G-Code</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty Avail</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lead Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mfg</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mfg Part #</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.slice(0, 10).map((quote, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{quote._item_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{quote._item_g_code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        ${parseFloat(quote.price_each).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {quote.qty_available}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {quote.lead_time_days || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{quote.manufacturer || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{quote.manufacturer_part_number || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <div className="p-4 text-sm text-gray-500 text-center">
                  Showing first 10 of {previewData.length} quotes
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => navigate(`/rfqs/${rfqId}`)}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 shadow-md disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing...' : 'Import Quotes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
