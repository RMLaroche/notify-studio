import React, { useState, useEffect, useRef } from 'react';
import { Message, PlatformStats } from '../types';

interface MessageFeedProps {
  messages: Message[];
  stats: PlatformStats | null;
}

const MessageFeed: React.FC<MessageFeedProps> = ({ messages, stats }) => {
  const [filter, setFilter] = useState<'all' | 'logs' | 'alerts'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredMessages = messages.filter(msg => {
    if (filter !== 'all' && msg.streamType !== filter) return false;
    if (levelFilter !== 'all' && msg.level !== levelFilter) return false;
    return true;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getStreamTypeColor = (type: string) => {
    return type === 'alerts' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Real-time Monitoring</h2>
        {stats && (
          <div className="flex space-x-4 text-sm">
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded">
              {stats.activeClients} active
            </div>
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {stats.messagesLastHour} msgs/hr
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex space-x-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Type:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="logs">Logs</option>
            <option value="alerts">Alerts</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Level:</label>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-md p-4 space-y-2 min-h-0">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet.</p>
            <p className="text-sm">Connect a CLI client to see real-time messages.</p>
          </div>
        ) : (
          filteredMessages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border ${getLevelColor(message.level)}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{message.clientName}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStreamTypeColor(message.streamType)}`}>
                    {message.streamType.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(message.level)}`}>
                    {message.level.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <p className="text-sm font-mono break-words">{message.message}</p>
              
              {message.metadata && Object.keys(message.metadata).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                    Metadata
                  </summary>
                  <pre className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(message.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Clients:</span>
            <span className="ml-2 font-medium">{stats.totalClients}</span>
          </div>
          <div>
            <span className="text-gray-600">Active Modules:</span>
            <span className="ml-2 font-medium">{stats.activeModules}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageFeed;