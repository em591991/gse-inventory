// frontend/src/services/itemService.js
import axiosClient from '../api/axiosClient';

export const fetchItems = async (params = {}) => {
  const response = await axiosClient.get('/items/', { params });
  // Handle both paginated response (with 'results' key) and direct array
  return response.data.results || response.data;
};

export const fetchItemById = async (itemId) => {
  const response = await axiosClient.get(`/items/${itemId}/`);
  return response.data;
};

export const createItem = async (itemData) => {
  const response = await axiosClient.post('/items/', itemData);
  return response.data;
};

export const updateItem = async (itemId, itemData) => {
  const response = await axiosClient.patch(`/items/${itemId}/`, itemData);
  return response.data;
};

export const deleteItem = async (itemId) => {
  const response = await axiosClient.delete(`/items/${itemId}/`);
  return response.data;
};

export const fetchUOMs = async () => {
  const response = await axiosClient.get('/uoms/');
  return response.data.results || response.data;
};
