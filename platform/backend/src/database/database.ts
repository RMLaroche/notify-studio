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
}

export const db = new Database(process.env.DATABASE_PATH);