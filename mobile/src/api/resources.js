import client from './client';
import { API_BASE } from './client';
import axios from 'axios';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (username, password) =>
    axios.post(`${API_BASE}/token/`, { username, password }),
  refresh: (refresh) =>
    axios.post(`${API_BASE}/token/refresh/`, { refresh }),
};

// ── Generic CRUD factory ──────────────────────────────────────────────────────
const crud = (resource) => ({
  list:   (params)     => client.get(`/${resource}/`, { params }),
  get:    (id)         => client.get(`/${resource}/${id}/`),
  create: (data)       => client.post(`/${resource}/`, data),
  update: (id, data)   => client.patch(`/${resource}/${id}/`, data),
  remove: (id)         => client.delete(`/${resource}/${id}/`),
});

// ── Resources ─────────────────────────────────────────────────────────────────
export const clinics              = crud('clinics');
export const tutors               = crud('tutors');
export const pets                 = crud('pets');
export const employees            = crud('employees');
export const services             = crud('services');
export const products             = crud('products');
export const schedulings          = crud('schedulings');
export const stockMovements       = crud('stock-movements');
export const financialRecords     = crud('financial-records');
export const financialTransactions = crud('financial-transactions');
