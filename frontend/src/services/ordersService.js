// frontend/src/services/ordersService.js
import axiosClient from "../api/axiosClient";

/**
 * Fetch all orders
 * @param {Object} params - Query parameters (type, status, etc.)
 * @returns {Promise} List of orders
 */
export const fetchOrders = async (params = {}) => {
  const response = await axiosClient.get("/orders/", { params });
  // Django REST Framework returns paginated response with 'results' key
  return response.data.results || response.data;
};

/**
 * Fetch a single order by ID
 * @param {string} orderId - UUID of the order
 * @returns {Promise} Order details
 */
export const fetchOrderById = async (orderId) => {
  const response = await axiosClient.get(`/orders/${orderId}/`);
  return response.data;
};

/**
 * Download pick ticket PDF for an order
 * @param {string} orderId - UUID of the order
 * @returns {Promise} Blob containing PDF
 */
export const downloadPickTicket = async (orderId) => {
  const response = await axiosClient.get(`/orders/${orderId}/pick-ticket/`, {
    responseType: 'blob', // Important for file download
  });
  
  // Create a download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `pick_ticket_${orderId.substring(0, 8)}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return response.data;
};

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Promise} Created order
 */
export const createOrder = async (orderData) => {
  const response = await axiosClient.post("/orders/", orderData);
  return response.data;
};

/**
 * Update an order
 * @param {string} orderId - UUID of the order
 * @param {Object} orderData - Updated order data
 * @returns {Promise} Updated order
 */
export const updateOrder = async (orderId, orderData) => {
  const response = await axiosClient.patch(`/orders/${orderId}/`, orderData);
  return response.data;
};

/**
 * Delete an order
 * @param {string} orderId - UUID of the order
 * @returns {Promise}
 */
export const deleteOrder = async (orderId) => {
  const response = await axiosClient.delete(`/orders/${orderId}/`);
  return response.data;
};