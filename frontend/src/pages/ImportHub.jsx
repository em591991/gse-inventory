import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function ImportHub() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("csv-templates/");
      setTemplates(response.data.templates || []);
      setError("");
    } catch (err) {
      setError("Failed to load templates: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async (templateKey, templateName) => {
    try {
      const response = await axiosClient.get(`csv-templates/${templateKey}/`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${templateKey}_template.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download template: " + (err.response?.data?.error || err.message));
    }
  };

  const handleExportData = async (templateKey) => {
    try {
      // Map template keys to export endpoints
      const exportEndpoints = {
        'items': 'items-export/',
        'vendor-items': 'vendor-items-export/',
      };

      const endpoint = exportEndpoints[templateKey];
      if (!endpoint) {
        alert("Export not yet available for this data type");
        return;
      }

      const response = await axiosClient.get(endpoint, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${templateKey}_export_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export data: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUploadClick = (templateKey) => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => handleFileUpload(e.target.files[0], templateKey);
    input.click();
  };

  const handleFileUpload = async (file, templateKey) => {
    if (!file) return;

    // Map template keys to upload endpoints
    const uploadEndpoints = {
      'items': 'items-upload/',
      'vendor-items': 'vendor-items-upload/',
    };

    const endpoint = uploadEndpoints[templateKey];
    if (!endpoint) {
      alert("Upload not yet available for this data type");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadStatus(null);
    setError("");

    try {
      const response = await axiosClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus({
        type: 'success',
        message: response.data.message,
        created: response.data.created,
        updated: response.data.updated,
        errors: response.data.errors || [],
      });
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err.response?.data?.error || err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-8">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Import Hub</h1>
        <p className="text-gray-600">
          Download CSV templates and upload bulk data for your inventory system
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Upload Status */}
      {uploadStatus && (
        <div className={`border rounded-lg p-4 mb-4 ${
          uploadStatus.type === 'success'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`font-semibold mb-2 ${
                uploadStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {uploadStatus.message}
              </p>
              {uploadStatus.type === 'success' && (
                <div className="text-sm text-green-700 space-y-1">
                  <p>Created: {uploadStatus.created} | Updated: {uploadStatus.updated}</p>
                  {uploadStatus.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold text-red-700">Errors:</p>
                      <ul className="list-disc list-inside">
                        {uploadStatus.errors.map((err, idx) => (
                          <li key={idx} className="text-red-600">{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setUploadStatus(null)}
              className="text-gray-500 hover:text-gray-700 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800">Uploading file... Please wait.</p>
        </div>
      )}

      {/* Import Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">How to Import Data</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Click "Get Template" to download the CSV template for your data type</li>
          <li>Open the template in Excel or Google Sheets</li>
          <li>Fill in your data following the example row provided</li>
          <li>Save as CSV format</li>
          <li>Click "Upload" and select your completed CSV file</li>
        </ol>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.key}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
              <svg
                className="w-8 h-8 text-green-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Required Fields
              </p>
              <div className="flex flex-wrap gap-1">
                {template.required_fields.map((field) => (
                  <span
                    key={field}
                    className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleDownloadTemplate(template.key, template.name)}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Get Template
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUploadClick(template.key)}
                  disabled={uploading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload
                </button>
                <button
                  onClick={() => handleExportData(template.key)}
                  className="flex-1 bg-gseblue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Export Data
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Links Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Data</h2>
        <p className="text-sm text-gray-600 mb-4">
          After preparing your CSV file, use these links to upload your data:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/upload/items"
            className="block p-4 border border-gray-300 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors"
          >
            <div className="font-semibold text-gray-800 mb-1">Import Items</div>
            <div className="text-xs text-gray-600">Upload inventory items catalog</div>
          </a>
          <a
            href="/upload/vendor-items"
            className="block p-4 border border-gray-300 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors"
          >
            <div className="font-semibold text-gray-800 mb-1">Import Vendor Pricing</div>
            <div className="text-xs text-gray-600">Upload vendor item pricing</div>
          </a>
          <div className="block p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
            <div className="font-semibold text-gray-500 mb-1">Import Locations</div>
            <div className="text-xs text-gray-500">Coming soon</div>
          </div>
          <div className="block p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
            <div className="font-semibold text-gray-500 mb-1">Import Vehicles</div>
            <div className="text-xs text-gray-500">Coming soon</div>
          </div>
          <div className="block p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
            <div className="font-semibold text-gray-500 mb-1">Import Users</div>
            <div className="text-xs text-gray-500">Coming soon</div>
          </div>
          <div className="block p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
            <div className="font-semibold text-gray-500 mb-1">Import Item Policies</div>
            <div className="text-xs text-gray-500">Coming soon</div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-gray-100 border border-gray-300 rounded p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Import Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Download templates to see the correct CSV format and example data</li>
          <li>• Required fields must have values, optional fields can be left empty</li>
          <li>• Import dependencies in order: Items → Vendor Items → Item Location Policies</li>
          <li>• Templates include validation rules - follow the example rows carefully</li>
          <li>• Large imports may take a few moments - please wait for confirmation</li>
        </ul>
      </div>
    </div>
  );
}
