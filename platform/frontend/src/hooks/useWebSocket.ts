import { useEffect, useState } from 'react';
import { wsService } from '../services/websocket';
import { Message } from '../types';

export const useWebSocket = (serverUrl?: string) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const socket = wsService.connect(serverUrl);

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for new messages
    wsService.onNewMessage((message: Message) => {
      setMessages(prev => [...prev.slice(-99), message]); // Keep last 100 messages
    });

    // Listen for client status updates
    wsService.onClientStatusUpdate((data) => {
      console.log('Client status update:', data);
    });

    // Listen for metrics updates
    wsService.onMetricsUpdate((data) => {
      console.log('Metrics update:', data);
    });

    return () => {
      wsService.disconnect();
      setConnected(false);
    };
  }, [serverUrl]);

  return {
    connected,
    messages,
    clearMessages: () => setMessages([])
  };
};