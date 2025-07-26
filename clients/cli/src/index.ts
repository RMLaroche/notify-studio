#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import { spawn } from 'child_process';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { NotifyClient } from './lib/client';
import { CLIOptions, ClientConfig } from './types';

const program = new Command();

// Load config file if exists
async function loadConfig(): Promise<ClientConfig> {
  const configPaths = [
    '.notify-cli.json',
    path.join(process.env.HOME || '', '.notify-cli.json'),
    '/etc/notify-cli.json'
  ];

  for (const configPath of configPaths) {
    if (await fs.pathExists(configPath)) {
      try {
        return await fs.readJson(configPath);
      } catch (error) {
        console.warn(`Warning: Failed to parse config file ${configPath}`);
      }
    }
  }

  return {};
}

// Process stdin for piped input
async function processStdin(client: NotifyClient, options: CLIOptions): Promise<void> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', async (line) => {
      if (line.trim()) {
        if (options.stream) {
          await client.streamMessage(line, options.level, { source: 'stdin' });
        } else {
          await client.sendAlert(line, options.level, { source: 'stdin' });
        }
      }
    });

    rl.on('close', () => {
      resolve();
    });
  });
}

// Execute command and capture output
async function executeCommand(client: NotifyClient, command: string, options: CLIOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Executing: ${command}`);
    
    const child = spawn('sh', ['-c', command], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', async (data) => {
      const output = data.toString();
      stdout += output;
      
      if (options.stream) {
        const lines = output.split('\n').filter((line: string) => line.trim());
        for (const line of lines) {
          await client.streamMessage(line, 'info', { source: 'exec', command });
        }
      }
    });

    child.stderr.on('data', async (data) => {
      const output = data.toString();
      stderr += output;
      
      if (options.stream) {
        const lines = output.split('\n').filter((line: string) => line.trim());
        for (const line of lines) {
          await client.streamMessage(line, 'error', { source: 'exec', command });
        }
      }
    });

    child.on('close', async (code) => {
      if (code === 0) {
        if (!options.stream && stdout.trim()) {
          await client.sendAlert(`Command completed: ${command}`, 'info', { 
            stdout: stdout.trim(),
            command,
            exitCode: code
          });
        }
        console.log(`✅ Command completed with exit code ${code}`);
      } else {
        const errorMessage = `Command failed: ${command} (exit code ${code})`;
        await client.sendAlert(errorMessage, 'error', {
          stderr: stderr.trim(),
          stdout: stdout.trim(),
          command,
          exitCode: code
        });
        console.error(`❌ Command failed with exit code ${code}`);
      }
      
      resolve();
    });

    child.on('error', (error) => {
      console.error(`❌ Failed to execute command: ${error.message}`);
      reject(error);
    });
  });
}

// Watch file for changes
async function watchFile(client: NotifyClient, filePath: string, options: CLIOptions): Promise<void> {
  if (!await fs.pathExists(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`👀 Watching file: ${filePath}`);
  
  // Read existing content first
  const stream = createReadStream(filePath, { encoding: 'utf8' });
  const rl = createInterface({
    input: stream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) {
      await client.streamMessage(line, options.level, { source: 'file', file: filePath });
    }
  }

  // Watch for new content
  const watcher = fs.watch(filePath, async (eventType) => {
    if (eventType === 'change') {
      // Implementation for tailing file changes would go here
      // For now, just log that file changed
      await client.streamMessage(`File changed: ${filePath}`, 'info', { source: 'file-watch', file: filePath });
    }
  });

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping file watcher...');
    watcher.close();
    process.exit(0);
  });
}

async function main() {
  const config = await loadConfig();

  program
    .name('notify-cli')
    .description('CLI client for Notify-Studio with offline queuing support')
    .version('1.0.0');

  program
    .option('-s, --server <server>', 'Platform server address', config.server || 'localhost:3001')
    .option('-t, --token <token>', 'Authentication token', config.token)
    .option('-m, --message <message>', 'Message to send')
    .option('-l, --level <level>', 'Message level', config.defaultLevel || 'info')
    .option('--type <type>', 'Message type (logs|alerts)', config.defaultType || 'alerts')
    .option('--stream', 'Enable streaming mode (WebSocket)')
    .option('--offline', 'Enable offline queuing', true)
    .option('--queue-size <size>', 'Maximum queue size', config.queueSize?.toString() || '1000')
    .option('--exec <command>', 'Execute command and send output')
    .option('--watch <file>', 'Watch file for changes')
    .option('--queue-info', 'Show queue information')
    .option('--clear-queue', 'Clear offline queue');

  program.action(async (options) => {
    if (!options.token) {
      console.error('❌ Token is required. Use --token or set in config file.');
      process.exit(1);
    }

    const cliOptions: CLIOptions = {
      server: options.server,
      token: options.token,
      message: options.message,
      level: options.level,
      type: options.type,
      stream: options.stream,
      offline: options.offline,
      queueSize: parseInt(options.queueSize),
      exec: options.exec,
      watch: options.watch
    };

    const client = new NotifyClient(cliOptions);

    // Handle queue operations
    if (options.queueInfo) {
      const info = await client.getQueueInfo();
      console.log(`📦 Queue: ${info.size} messages`);
      if (info.size > 0) {
        console.log('Recent messages:');
        info.messages.slice(0, 5).forEach(msg => {
          console.log(`  ${msg.timestamp} [${msg.level}] ${msg.message.substring(0, 80)}...`);
        });
      }
      process.exit(0);
    }

    if (options.clearQueue) {
      await client.clearQueue();
      process.exit(0);
    }

    // Check connection
    const isConnected = await client.checkConnection();
    if (!isConnected && !options.offline) {
      console.error('❌ Cannot connect to platform and offline mode disabled');
      process.exit(1);
    }

    try {
      if (options.exec) {
        await executeCommand(client, options.exec, cliOptions);
      } else if (options.watch) {
        await watchFile(client, options.watch, cliOptions);
      } else if (options.message) {
        if (options.stream) {
          await client.streamMessage(options.message, options.level);
        } else {
          await client.sendAlert(options.message, options.level);
        }
      } else if (!process.stdin.isTTY) {
        // Handle piped input
        await processStdin(client, cliOptions);
      } else {
        console.error('❌ No input provided. Use --message, --exec, --watch, or pipe input.');
        program.help();
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } finally {
      client.disconnect();
    }
  });

  program.parse();
}

if (require.main === module) {
  main().catch(console.error);
}

export { NotifyClient };