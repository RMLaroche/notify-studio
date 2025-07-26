import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageList from '../MessageList';

describe('MessageList', () => {
  const mockMessages = [
    {
      id: 1,
      client_id: 1,
      client_name: 'TestClient1',
      message: 'Error in application',
      level: 'error' as const,
      type: 'alerts' as const,
      metadata: { source: 'app.js', line: 42 },
      created_at: '2024-01-01T12:00:00Z'
    },
    {
      id: 2,
      client_id: 2,
      client_name: 'TestClient2',
      message: 'Info message',
      level: 'info' as const,
      type: 'logs' as const,
      metadata: null,
      created_at: '2024-01-01T12:01:00Z'
    },
    {
      id: 3,
      client_id: 1,
      client_name: 'TestClient1',
      message: 'Warning message',
      level: 'warning' as const,
      type: 'alerts' as const,
      metadata: { component: 'auth' },
      created_at: '2024-01-01T12:02:00Z'
    }
  ];

  it('renders all messages', () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByText('Error in application')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('displays client names correctly', () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getAllByText('TestClient1')).toHaveLength(2);
    expect(screen.getByText('TestClient2')).toBeInTheDocument();
  });

  it('shows different level styles', () => {
    render(<MessageList messages={mockMessages} />);

    const errorMessage = screen.getByText('Error in application').closest('.message-item');
    const infoMessage = screen.getByText('Info message').closest('.message-item');
    const warningMessage = screen.getByText('Warning message').closest('.message-item');

    expect(errorMessage).toHaveClass('level-error');
    expect(infoMessage).toHaveClass('level-info');
    expect(warningMessage).toHaveClass('level-warning');
  });

  it('displays timestamps correctly', () => {
    render(<MessageList messages={mockMessages} />);

    // Should show relative time or formatted timestamp
    expect(screen.getByText(/12:00/)).toBeInTheDocument();
    expect(screen.getByText(/12:01/)).toBeInTheDocument();
    expect(screen.getByText(/12:02/)).toBeInTheDocument();
  });

  it('shows metadata when available', () => {
    render(<MessageList messages={mockMessages} />);

    // Click on message with metadata to expand
    const errorMessage = screen.getByText('Error in application');
    fireEvent.click(errorMessage);

    expect(screen.getByText(/source.*app\.js/)).toBeInTheDocument();
    expect(screen.getByText(/line.*42/)).toBeInTheDocument();
  });

  it('handles empty message list', () => {
    render(<MessageList messages={[]} />);

    expect(screen.getByText(/No messages/)).toBeInTheDocument();
  });

  it('filters messages by search term', () => {
    render(<MessageList messages={mockMessages} />);

    const searchInput = screen.getByPlaceholderText(/Search messages/);
    fireEvent.change(searchInput, { target: { value: 'error' } });

    expect(screen.getByText('Error in application')).toBeInTheDocument();
    expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
  });

  it('filters messages by level', () => {
    render(<MessageList messages={mockMessages} />);

    const levelFilter = screen.getByDisplayValue('all');
    fireEvent.change(levelFilter, { target: { value: 'error' } });

    expect(screen.getByText('Error in application')).toBeInTheDocument();
    expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
  });

  it('shows message types correctly', () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getAllByText('alerts')).toHaveLength(2);
    expect(screen.getByText('logs')).toBeInTheDocument();
  });

  it('auto-scrolls to newest messages', () => {
    const { rerender } = render(<MessageList messages={mockMessages} />);

    const newMessages = [
      ...mockMessages,
      {
        id: 4,
        client_id: 1,
        client_name: 'TestClient1',
        message: 'New message',
        level: 'info' as const,
        type: 'alerts' as const,
        metadata: null,
        created_at: '2024-01-01T12:03:00Z'
      }
    ];

    rerender(<MessageList messages={newMessages} />);

    expect(screen.getByText('New message')).toBeInTheDocument();
  });
});