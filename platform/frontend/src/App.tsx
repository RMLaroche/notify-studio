import React, { useState, useEffect } from 'react';
import ClientPanel from './components/ClientPanel';
import MessageFeed from './components/MessageFeed';
import ModulePanel from './components/ModulePanel';
import { useWebSocket } from './hooks/useWebSocket';
import { apiService } from './services/api';
import { Client, OutputModule, PlatformStats } from './types';

function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [modules, setModules] = useState<OutputModule[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { connected, messages } = useWebSocket();

  const fetchClients = async () => {
    try {
      const response = await apiService.getClients();
      setClients(response.clients);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const health = await apiService.getHealth();
      setStats(health.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchClients(),
        fetchStats()
      ]);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-900 font-medium mb-2">Dashboard Error</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Notify-Studio</h1>
              <span className="ml-3 text-sm text-gray-500">Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    connected ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <button
                onClick={fetchData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">
          {/* Left Column - Client Producers */}
          <div className="lg:col-span-1">
            <ClientPanel clients={clients} onRefresh={fetchClients} />
          </div>

          {/* Center Column - Real-time Monitoring */}
          <div className="lg:col-span-1">
            <MessageFeed messages={messages} stats={stats} />
          </div>

          {/* Right Column - Output Modules */}
          <div className="lg:col-span-1">
            <ModulePanel modules={modules} onRefresh={() => {}} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Notify-Studio v1.0.0 - Phase 1 MVP</p>
            <div className="flex items-center space-x-4">
              <span>Messages: {messages.length}</span>
              <span>Clients: {clients.length}</span>
              <span>Modules: {modules.length}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
