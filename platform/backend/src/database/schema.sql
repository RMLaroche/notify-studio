-- Client producers (log sources)
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME,
    connection_type TEXT CHECK(connection_type IN ('websocket', 'rest', 'both')) DEFAULT 'both'
);

-- Output modules (destinations)
CREATE TABLE IF NOT EXISTS output_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('discord', 'email', 'slack', 'webhook')),
    config TEXT NOT NULL, -- JSON string
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Routing connections
CREATE TABLE IF NOT EXISTS routing_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    output_module_id INTEGER NOT NULL,
    stream_type TEXT NOT NULL CHECK(stream_type IN ('logs', 'alerts')),
    filters TEXT, -- JSON string
    rate_limit TEXT, -- JSON string
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (output_module_id) REFERENCES output_modules(id) ON DELETE CASCADE
);

-- Message history (7-day retention)
CREATE TABLE IF NOT EXISTS message_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    level TEXT CHECK(level IN ('info', 'warn', 'error', 'debug')),
    stream_type TEXT CHECK(stream_type IN ('logs', 'alerts')),
    metadata TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_token ON clients(token);
CREATE INDEX IF NOT EXISTS idx_clients_last_seen ON clients(last_seen);
CREATE INDEX IF NOT EXISTS idx_routing_rules_client_id ON routing_rules(client_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_module_id ON routing_rules(output_module_id);
CREATE INDEX IF NOT EXISTS idx_message_history_client_id ON message_history(client_id);
CREATE INDEX IF NOT EXISTS idx_message_history_created_at ON message_history(created_at);