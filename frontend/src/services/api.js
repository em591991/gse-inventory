// src/services/api.js  This file is the connection bridge between React and Django
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",   // Django API root
});

export default api;
