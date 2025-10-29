// frontend/src/services/rfqService.js
import axiosClient from '../api/axiosClient';

// RFQ endpoints
export const fetchRFQs = async () => {
  const response = await axiosClient.get('/rfqs/');
  // Handle both paginated response (with 'results' key) and direct array
  return response.data.results || response.data;
};

export const fetchRFQById = async (rfqId) => {
  const response = await axiosClient.get(`/rfqs/${rfqId}/`);
  return response.data;
};

export const createRFQ = async (rfqData) => {
  const response = await axiosClient.post('/rfqs/', rfqData);
  return response.data;
};

export const updateRFQ = async (rfqId, rfqData) => {
  const response = await axiosClient.patch(`/rfqs/${rfqId}/`, rfqData);
  return response.data;
};

export const deleteRFQ = async (rfqId) => {
  const response = await axiosClient.delete(`/rfqs/${rfqId}/`);
  return response.data;
};

export const sendRFQToVendors = async (rfqId) => {
  const response = await axiosClient.post(`/rfqs/${rfqId}/send_to_vendors/`);
  return response.data;
};

export const fetchRFQQuotes = async (rfqId) => {
  const response = await axiosClient.get(`/rfqs/${rfqId}/quotes/`);
  return response.data;
};

export const fetchReplenishmentData = async (rfqId) => {
  const response = await axiosClient.get(`/rfqs/${rfqId}/replenishment_data/`);
  return response.data;
};

// Vendor Quote endpoints
export const fetchVendorQuotes = async (params = {}) => {
  const response = await axiosClient.get('/vendor-quotes/', { params });
  return response.data;
};

export const createVendorQuote = async (quoteData) => {
  const response = await axiosClient.post('/vendor-quotes/', quoteData);
  return response.data;
};

export const bulkCreateVendorQuotes = async (quotesArray) => {
  const response = await axiosClient.post('/vendor-quotes/bulk_create/', {
    quotes: quotesArray
  });
  return response.data;
};

// RFQ Vendor endpoints
export const fetchRFQVendors = async (rfqId) => {
  const response = await axiosClient.get('/rfq-vendors/', {
    params: { rfq: rfqId }
  });
  return response.data;
};

export const markVendorQuoted = async (rfqVendorId) => {
  const response = await axiosClient.post(`/rfq-vendors/${rfqVendorId}/mark_quoted/`);
  return response.data;
};

export const markVendorDeclined = async (rfqVendorId) => {
  const response = await axiosClient.post(`/rfq-vendors/${rfqVendorId}/mark_declined/`);
  return response.data;
};

// Replenishment endpoints
export const fetchReplenishments = async (params = {}) => {
  const response = await axiosClient.get('/replenishments/', { params });
  return response.data;
};

export const fetchReplenishmentById = async (replenishmentId) => {
  const response = await axiosClient.get(`/replenishments/${replenishmentId}/`);
  return response.data;
};

export const createReplenishment = async (replenishmentData) => {
  const response = await axiosClient.post('/replenishments/', replenishmentData);
  return response.data;
};

export const finalizeReplenishment = async (replenishmentId) => {
  const response = await axiosClient.post(`/replenishments/${replenishmentId}/finalize/`);
  return response.data;
};

// Replenishment Line endpoints
export const createReplenishmentLine = async (lineData) => {
  const response = await axiosClient.post('/replenishment-lines/', lineData);
  return response.data;
};

export const updateReplenishmentLine = async (lineId, lineData) => {
  const response = await axiosClient.patch(`/replenishment-lines/${lineId}/`, lineData);
  return response.data;
};

export const deleteReplenishmentLine = async (lineId) => {
  const response = await axiosClient.delete(`/replenishment-lines/${lineId}/`);
  return response.data;
};

// Additional helper to create replenishment with lines in one call
export const createReplenishmentWithLines = async (replenishmentData) => {
  // First create the replenishment
  const replenishment = await createReplenishment({
    rfq: replenishmentData.rfq,
    status: 'DRAFT'
  });

  // Then create all lines
  const linePromises = replenishmentData.lines.map(line =>
    createReplenishmentLine({
      ...line,
      replenishment: replenishment.replenishment_id
    })
  );

  await Promise.all(linePromises);

  return replenishment;
};
