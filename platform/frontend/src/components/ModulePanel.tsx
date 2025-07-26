import React, { useState } from 'react';
import { OutputModule } from '../types';

interface ModulePanelProps {
  modules: OutputModule[];
  onRefresh: () => void;
}

const ModulePanel: React.FC<ModulePanelProps> = ({ modules, onRefresh }) => {
  const [isAddingModule, setIsAddingModule] = useState(false);

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'discord': return '💬';
      case 'email': return '📧';
      case 'slack': return '💬';
      case 'webhook': return '🔗';
      default: return '📡';
    }
  };

  const getModuleColor = (type: string) => {
    switch (type) {
      case 'discord': return 'bg-indigo-100 text-indigo-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'slack': return 'bg-purple-100 text-purple-800';
      case 'webhook': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Output Modules</h2>
        <button
          onClick={() => setIsAddingModule(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          + Add Module
        </button>
      </div>

      {isAddingModule && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Add Output Module</h3>
          <p className="text-sm text-gray-600 mb-3">
            Output modules will be implemented in Phase 2. For now, this shows the planned interface.
          </p>
          <button
            onClick={() => setIsAddingModule(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm"
          >
            Close
          </button>
        </div>
      )}

      <div className="space-y-3">
        {modules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No output modules configured yet.</p>
            <p className="text-sm">Add modules to route messages to external services.</p>
            
            {/* Preview of planned modules */}
            <div className="mt-6 space-y-3">
              <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💬</span>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Discord Bot</h4>
                    <p className="text-sm text-gray-600">Send messages to Discord channels</p>
                  </div>
                  <div className="ml-auto">
                    <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📧</span>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Email SMTP</h4>
                    <p className="text-sm text-gray-600">Send email notifications</p>
                  </div>
                  <div className="ml-auto">
                    <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔗</span>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Webhook</h4>
                    <p className="text-sm text-gray-600">Send to custom HTTP endpoints</p>
                  </div>
                  <div className="ml-auto">
                    <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          modules.map((module) => (
            <div
              key={module.id}
              className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getModuleIcon(module.type)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{module.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getModuleColor(module.type)}`}>
                      {module.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      module.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {module.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    Configure
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm">
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Created: {new Date(module.createdAt).toLocaleString()}</p>
              </div>

              <div className="mt-3 flex space-x-2">
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  0 connections
                </div>
                <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                  0 msgs sent
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ModulePanel;