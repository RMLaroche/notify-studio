import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { apiService } from '../services/api';

interface ClientPanelProps {
  clients: Client[];
  onRefresh: () => void;
}

const ClientPanel: React.FC<ClientPanelProps> = ({ clients, onRefresh }) => {
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateToken = async () => {
    if (!newClientName.trim()) return;
    
    setLoading(true);
    try {
      const response = await apiService.generateToken(newClientName);
      setGeneratedToken(response.token);
    } catch (error) {
      console.error('Failed to generate token:', error);
      alert('Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    setIsAddingClient(true);
    setNewClientName('');
    setGeneratedToken('');
  };

  const handleCancel = () => {
    setIsAddingClient(false);
    setNewClientName('');
    setGeneratedToken('');
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    
    try {
      await apiService.deleteClient(clientId);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('Failed to delete client');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Client Producers</h2>
        <button
          onClick={handleAddClient}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          + Add Client
        </button>
      </div>

      {isAddingClient && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Client</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Enter client name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {!generatedToken ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleGenerateToken}
                  disabled={!newClientName.trim() || loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm"
                >
                  {loading ? 'Generating...' : 'Generate Token'}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 mb-1">Token generated successfully!</p>
                  <code className="text-lg font-bold text-green-900">{generatedToken}</code>
                  <p className="text-xs text-green-700 mt-2">
                    Use this token with the CLI client to connect.
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="mt-3 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {clients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No clients connected yet.</p>
            <p className="text-sm">Add a client to get started.</p>
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{client.name}</h3>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === 'online'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-1 ${
                        client.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                      }`}
                    />
                    {client.status}
                  </span>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>Type: {client.connectionType}</p>
                <p>Messages: {client.messageCount}</p>
                {client.lastSeen && (
                  <p>Last seen: {new Date(client.lastSeen).toLocaleString()}</p>
                )}
              </div>

              <div className="mt-3 flex space-x-2">
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  LOGS
                </div>
                <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                  ALERTS
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientPanel;