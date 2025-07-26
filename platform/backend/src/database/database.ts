import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = './data/notify-studio.db') {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
      }
      console.log('Connected to SQLite database');
    });

    this.initializeSchema();
  }

  private initializeSchema(): void {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    this.db.exec(schema, (err) => {
      if (err) {
        console.error('Error initializing database schema:', err.message);
        process.exit(1);
      }
      console.log('Database schema initialized');
      
      // Run migrations
      this.runMigrations();
    });
  }

  private runMigrations(): void {
    // Migration: Update message_history table to support new log levels
    const migrationSql = `
      -- Create new table with updated constraints
      CREATE TABLE IF NOT EXISTS message_history_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        level TEXT CHECK(level IN ('info', 'success', 'warn', 'warning', 'error', 'debug')),
        stream_type TEXT CHECK(stream_type IN ('logs', 'alerts')),
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      );

      -- Copy data from old table if it exists
      INSERT OR IGNORE INTO message_history_new (id, client_id, message, level, stream_type, metadata, created_at)
      SELECT id, client_id, message, level, stream_type, metadata, created_at 
      FROM message_history WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='message_history');

      -- Drop old table and rename new one
      DROP TABLE IF EXISTS message_history;
      ALTER TABLE message_history_new RENAME TO message_history;

      -- Recreate indexes
      CREATE INDEX IF NOT EXISTS idx_message_history_client_id ON message_history(client_id);
      CREATE INDEX IF NOT EXISTS idx_message_history_created_at ON message_history(created_at);
    `;
    
    this.db.exec(migrationSql, (err) => {
      if (err) {
        console.error('Error running migrations:', err.message);
      } else {
        console.log('Database migrations completed');
      }
    });
  }

  public run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  public get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  public all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }

  public cleanupOldMessages(retentionDays: number = 7): Promise<sqlite3.RunResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    return this.run(
      'DELETE FROM message_history WHERE created_at < ?',
      [cutoffDate.toISOString()]
    );
  }

  // Higher-level methods for client management
  public async addClient(name: string, token: string, connectionType: 'rest' | 'websocket'): Promise<number> {
    const result = await this.run(
      'INSERT INTO clients (name, token, connection_type) VALUES (?, ?, ?)',
      [name, token, connectionType]
    );
    return result.lastID!;
  }

  public async getClientByToken(token: string): Promise<any> {
    return await this.get('SELECT * FROM clients WHERE token = ?', [token]);
  }

  public async getAllClients(): Promise<any[]> {
    return await this.all('SELECT * FROM clients ORDER BY created_at DESC');
  }

  public async deleteClient(id: number): Promise<sqlite3.RunResult> {
    return await this.run('DELETE FROM clients WHERE id = ?', [id]);
  }

  public async updateClientLastSeen(id: number): Promise<sqlite3.RunResult> {
    return await this.run(
      'UPDATE clients SET last_seen = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  // Higher-level methods for message management
  public async addMessage(
    clientId: number,
    message: string,
    level: string,
    type: string,
    metadata?: any
  ): Promise<number> {
    const result = await this.run(
      'INSERT INTO message_history (client_id, message, level, stream_type, metadata) VALUES (?, ?, ?, ?, ?)',
      [clientId, message, level, type, metadata ? JSON.stringify(metadata) : null]
    );
    return result.lastID!;
  }

  public async getRecentMessages(limit: number = 50): Promise<any[]> {
    return await this.all(`
      SELECT m.*, c.name as client_name, m.stream_type as type
      FROM message_history m 
      LEFT JOIN clients c ON m.client_id = c.id 
      ORDER BY m.created_at DESC 
      LIMIT ?
    `, [limit]);
  }

  public async getMessagesByClient(clientId: number, limit: number = 50): Promise<any[]> {
    return await this.all(`
      SELECT m.*, c.name as client_name, m.stream_type as type
      FROM message_history m 
      LEFT JOIN clients c ON m.client_id = c.id 
      WHERE m.client_id = ? 
      ORDER BY m.created_at DESC 
      LIMIT ?
    `, [clientId, limit]);
  }

  // Statistics methods
  public async getClientCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM clients');
    return result.count;
  }

  public async getMessageCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM message_history');
    return result.count;
  }

  public async getMessageCountSince(timestamp: string): Promise<number> {
    const result = await this.get(
      'SELECT COUNT(*) as count FROM message_history WHERE created_at > ?',
      [timestamp]
    );
    return result.count;
  }
}

export const db = new Database(process.env.DATABASE_PATH);