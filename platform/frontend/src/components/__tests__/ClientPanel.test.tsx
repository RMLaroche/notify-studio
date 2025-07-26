import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClientPanel from '../ClientPanel';

// Mock fetch globally
global.fetch = jest.fn();

describe('ClientPanel', () => {
  const mockClients = [
    {
      id: 1,
      name: 'TestClient1',
      token: 'ABC123',
      connection_type: 'rest' as const,
      created_at: '2024-01-01T00:00:00Z',
      last_seen: '2024-01-01T01:00:00Z'
    },
    {
      id: 2,
      name: 'TestClient2',
      token: 'DEF456',
      connection_type: 'websocket' as const,
      created_at: '2024-01-01T00:00:00Z',
      last_seen: '2024-01-01T01:30:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders client list', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClients
    });

    render(<ClientPanel />);

    await waitFor(() => {
      expect(screen.getByText('TestClient1')).toBeInTheDocument();
      expect(screen.getByText('TestClient2')).toBeInTheDocument();
    });
  });

  it('shows connection types correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClients
    });

    render(<ClientPanel />);

    await waitFor(() => {
      expect(screen.getByText('REST')).toBeInTheDocument();
      expect(screen.getByText('WebSocket')).toBeInTheDocument();
    });
  });

  it('handles add client flow', async () => {
    // Mock initial clients fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    // Mock token generation
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'XYZ789', clientName: 'NewClient' })
    });

    // Mock client registration
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        message: 'Client registered successfully',
        client: { id: 3, name: 'NewClient', token: 'XYZ789' }
      })
    });

    render(<ClientPanel />);

    // Click add client button
    const addButton = screen.getByText('Add Client');
    fireEvent.click(addButton);

    // Fill in form
    const nameInput = screen.getByPlaceholderText('Client name');
    fireEvent.change(nameInput, { target: { value: 'NewClient' } });

    // Select connection type
    const typeSelect = screen.getByDisplayValue('rest');
    fireEvent.change(typeSelect, { target: { value: 'websocket' } });

    // Submit form
    const generateButton = screen.getByText('Generate Token & Register');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: 'NewClient' })
      });
    });
  });

  it('handles delete client', async () => {
    // Mock initial clients fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClients
    });

    // Mock delete request
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Client deleted successfully' })
    });

    render(<ClientPanel />);

    await waitFor(() => {
      expect(screen.getByText('TestClient1')).toBeInTheDocument();
    });

    // Find and click delete button for first client
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/clients/1', {
        method: 'DELETE'
      });
    });
  });

  it('shows error message on failed requests', async () => {
    // Mock failed fetch
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ClientPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading clients/)).toBeInTheDocument();
    });
  });

  it('displays last seen time correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClients
    });

    render(<ClientPanel />);

    await waitFor(() => {
      // Should show relative time for last seen
      expect(screen.getByText(/Last seen:/)).toBeInTheDocument();
    });
  });
});