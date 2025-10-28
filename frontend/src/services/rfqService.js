// frontend/src/services/rfqService.js
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// RFQ endpoints
export const fetchRFQs = async () => {
  const response = await axios.get(`${API_URL}/rfqs/`);
  return response.data;
};

export const fetchRFQById = async (rfqId) => {
  const response = await axios.get(`${API_URL}/rfqs/${rfqId}/`);
  return response.data;
};

export const createRFQ = async (rfqData) => {
  const response = await axios.post(`${API_URL}/rfqs/`, rfqData);
  return response.data;
};

export const updateRFQ = async (rfqId, rfqData) => {
  const response = await axios.patch(`${API_URL}/rfqs/${rfqId}/`, rfqData);
  return response.data;
};

export const deleteRFQ = async (rfqId) => {
  const response = await axios.delete(`${API_URL}/rfqs/${rfqId}/`);
  return response.data;
};

export const sendRFQToVendors = async (rfqId) => {
  const response = await axios.post(`${API_URL}/rfqs/${rfqId}/send_to_vendors/`);
  return response.data;
};

export const fetchRFQQuotes = async (rfqId) => {
  const response = await axios.get(`${API_URL}/rfqs/${rfqId}/quotes/`);
  return response.data;
};

export const fetchReplenishmentData = async (rfqId) => {
  const response = await axios.get(`${API_URL}/rfqs/${rfqId}/replenishment_data/`);
  return response.data;
};

// Vendor Quote endpoints
export const fetchVendorQuotes = async (params = {}) => {
  const response = await axios.get(`${API_URL}/vendor-quotes/`, { params });
  return response.data;
};

export const createVendorQuote = async (quoteData) => {
  const response = await axios.post(`${API_URL}/vendor-quotes/`, quoteData);
  return response.data;
};

export const bulkCreateVendorQuotes = async (quotesArray) => {
  const response = await axios.post(`${API_URL}/vendor-quotes/bulk_create/`, {
    quotes: quotesArray
  });
  return response.data;
};

// RFQ Vendor endpoints
export const fetchRFQVendors = async (rfqId) => {
  const response = await axios.get(`${API_URL}/rfq-vendors/`, {
    params: { rfq: rfqId }
  });
  return response.data;
};

export const markVendorQuoted = async (rfqVendorId) => {
  const response = await axios.post(`${API_URL}/rfq-vendors/${rfqVendorId}/mark_quoted/`);
  return response.data;
};

export const markVendorDeclined = async (rfqVendorId) => {
  const response = await axios.post(`${API_URL}/rfq-vendors/${rfqVendorId}/mark_declined/`);
  return response.data;
};

// Replenishment endpoints
export const fetchReplenishments = async (params = {}) => {
  const response = await axios.get(`${API_URL}/replenishments/`, { params });
  return response.data;
};

export const fetchReplenishmentById = async (replenishmentId) => {
  const response = await axios.get(`${API_URL}/replenishments/${replenishmentId}/`);
  return response.data;
};

export const createReplenishment = async (replenishmentData) => {
  const response = await axios.post(`${API_URL}/replenishments/`, replenishmentData);
  return response.data;
};

export const finalizeReplenishment = async (replenishmentId) => {
  const response = await axios.post(`${API_URL}/replenishments/${replenishmentId}/finalize/`);
  return response.data;
};

// Replenishment Line endpoints
export const createReplenishmentLine = async (lineData) => {
  const response = await axios.post(`${API_URL}/replenishment-lines/`, lineData);
  return response.data;
};

export const updateReplenishmentLine = async (lineId, lineData) => {
  const response = await axios.patch(`${API_URL}/replenishment-lines/${lineId}/`, lineData);
  return response.data;
};

export const deleteReplenishmentLine = async (lineId) => {
  const response = await axios.delete(`${API_URL}/replenishment-lines/${lineId}/`);
  return response.data;
};
