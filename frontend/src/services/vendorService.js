// frontend/src/services/vendorService.js
import axiosClient from '../api/axiosClient';

export const fetchVendors = async () => {
  const response = await axiosClient.get('/vendors/');
  // Handle both paginated response (with 'results' key) and direct array
  return response.data.results || response.data;
};

export const fetchVendorById = async (vendorId) => {
  const response = await axiosClient.get(`/vendors/${vendorId}/`);
  return response.data;
};

export const createVendor = async (vendorData) => {
  const response = await axiosClient.post('/vendors/', vendorData);
  return response.data;
};

export const updateVendor = async (vendorId, vendorData) => {
  const response = await axiosClient.patch(`/vendors/${vendorId}/`, vendorData);
  return response.data;
};

export const deleteVendor = async (vendorId) => {
  const response = await axiosClient.delete(`/vendors/${vendorId}/`);
  return response.data;
};
