import axios from 'axios';
import { Client } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const apiService = {
  // Health check
  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Clients
  getClients: async (): Promise<{ clients: Client[] }> => {
    const response = await api.get('/api/clients');
    return response.data;
  },

  getClient: async (id: number) => {
    const response = await api.get(`/api/clients/${id}`);
    return response.data;
  },

  deleteClient: async (id: number) => {
    const response = await api.delete(`/api/clients/${id}`);
    return response.data;
  },

  // Auth
  generateToken: async (clientName: string) => {
    const response = await api.post('/api/auth/generate-token', { clientName });
    return response.data;
  },

  registerClient: async (name: string, token: string, connectionType: string = 'both') => {
    const response = await api.post('/api/auth/register', { name, token, connectionType });
    return response.data;
  },
};