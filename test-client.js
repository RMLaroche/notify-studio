#!/usr/bin/env node

const readline = require('readline');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const PLATFORM_URL = process.env.PLATFORM_URL || 'http://localhost:3001';
let CLIENT_TOKEN = null;

console.log('🚀 Notify-Studio Interactive Test Client');
console.log('========================================');
console.log(`Platform URL: ${PLATFORM_URL}`);
console.log('');

// Helper function to prompt user input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Helper function to send HTTP requests using built-in Node.js modules
async function sendRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${PLATFORM_URL}${endpoint}`);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(CLIENT_TOKEN && { 'Authorization': `Bearer ${CLIENT_TOKEN}` }),
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    // Optional debug logging (uncomment for debugging)
    // console.log(`🔍 DEBUG: ${method} ${url.toString()}`);
    // console.log(`🔍 DEBUG: Headers:`, options.headers);
    // if (postData) console.log(`🔍 DEBUG: Body:`, postData);

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = responseData ? JSON.parse(responseData) : {};
            resolve(parsed);
          } else {
            const errorData = responseData ? JSON.parse(responseData) : {};
            reject(new Error(`HTTP ${res.statusCode}: ${errorData.message || res.statusMessage}`));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${parseError.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Generate a token and register client for testing
async function generateToken() {
  try {
    console.log('📝 Generating test client token...');
    const clientName = `TestClient-${Date.now()}`;
    
    // Step 1: Generate token
    const tokenResponse = await sendRequest('POST', '/api/auth/generate-token', {
      clientName
    });
    
    const token = tokenResponse.token;
    console.log(`✅ Token generated: ${token}`);
    
    // Step 2: Register client with the token
    console.log('📝 Registering client...');
    const registerResponse = await sendRequest('POST', '/api/auth/register', {
      name: clientName,
      token: token,
      connectionType: 'rest'
    });
    
    CLIENT_TOKEN = token;
    console.log(`✅ Client registered successfully`);
    console.log(`📋 Client name: ${clientName}`);
    console.log(`🆔 Client ID: ${registerResponse.client.id}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate/register client: ${error.message}`);
    return false;
  }
}

// Send a notification
async function sendNotification(message, level, type, metadata = null) {
  try {
    const payload = {
      message,
      level,
      type,
      ...(metadata && { metadata })
    };

    await sendRequest('POST', '/api/alert', payload);
    console.log(`✅ Notification sent successfully!`);
  } catch (error) {
    console.error(`❌ Failed to send notification: ${error.message}`);
  }
}

// Check platform health
async function checkHealth() {
  try {
    const health = await sendRequest('GET', '/health');
    console.log('🩺 Platform Health:');
    console.log(`  Status: ${health.status}`);
    console.log(`  Uptime: ${health.uptime}s`);
    console.log(`  Clients: ${health.stats.clients}`);
    console.log(`  Messages: ${health.stats.messages}`);
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
  }
}

// Show help menu
function showHelp() {
  console.log('');
  console.log('📖 Available Commands:');
  console.log('  send      - Send a notification');
  console.log('  quick     - Send a quick test notification');
  console.log('  health    - Check platform health');
  console.log('  token     - Generate new token');
  console.log('  help      - Show this help menu');
  console.log('  exit      - Exit the client');
  console.log('');
}

// Send quick test notification
async function sendQuickTest() {
  const testMessages = [
    { message: '🎉 Test Alert - Everything is working!', level: 'info', type: 'alerts' },
    { message: '✅ Test Success - Discord module active', level: 'success', type: 'alerts' },
    { message: '⚠️ Test Warning - Check your configuration', level: 'warning', type: 'logs' },
    { message: '❌ Test Error - Simulated error condition', level: 'error', type: 'alerts' },
    { message: '🔍 Test Debug - Debug information', level: 'debug', type: 'logs' }
  ];

  console.log('🚀 Sending 5 test notifications...');
  
  for (let i = 0; i < testMessages.length; i++) {
    const test = testMessages[i];
    console.log(`  ${i + 1}/5: ${test.level.toUpperCase()} - ${test.message}`);
    
    await sendNotification(
      test.message,
      test.level,
      test.type,
      { 
        test: true,
        index: i + 1,
        timestamp: new Date().toISOString(),
        source: 'interactive-test-client'
      }
    );
    
    // Small delay between messages
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('✅ All test notifications sent!');
}

// Interactive notification sender
async function sendInteractiveNotification() {
  try {
    console.log('');
    console.log('📝 Create New Notification:');
    
    const message = await prompt('  Message: ');
    if (!message.trim()) {
      console.log('❌ Message cannot be empty');
      return;
    }

    console.log('  Available levels: info, success, warning, error, debug');
    const level = await prompt('  Level [info]: ') || 'info';
    
    console.log('  Available types: alerts, logs');
    const type = await prompt('  Type [alerts]: ') || 'alerts';
    
    const metadataInput = await prompt('  Metadata (JSON, optional): ');
    let metadata = null;
    
    if (metadataInput.trim()) {
      try {
        metadata = JSON.parse(metadataInput);
      } catch (error) {
        console.log('⚠️ Invalid JSON metadata, sending without metadata');
      }
    }

    console.log('');
    console.log('📤 Sending notification...');
    await sendNotification(message, level, type, metadata);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Main interactive loop
async function main() {
  // Try to generate token initially
  const tokenGenerated = await generateToken();
  if (!tokenGenerated) {
    console.log('❌ Cannot continue without a valid token. Make sure the platform is running.');
    process.exit(1);
  }

  console.log('');
  console.log('🎮 Interactive mode started. Type "help" for commands.');
  showHelp();

  while (true) {
    try {
      const input = await prompt('💬 Command: ');
      
      // Handle null/undefined input (e.g., from EOF)
      if (input === null || input === undefined) {
        console.log('\n👋 Goodbye!');
        process.exit(0);
      }
      
      const command = input.trim().toLowerCase();

      switch (command) {
        case 'send':
          await sendInteractiveNotification();
          break;
          
        case 'quick':
          await sendQuickTest();
          break;
          
        case 'health':
          await checkHealth();
          break;
          
        case 'token':
          await generateToken();
          break;
          
        case 'help':
          showHelp();
          break;
          
        case 'exit':
        case 'quit':
        case 'q':
          console.log('👋 Goodbye!');
          process.exit(0);
          break;
          
        case '':
          // Empty input, just continue
          break;
          
        default:
          console.log(`❓ Unknown command: ${command}`);
          console.log('💡 Type "help" for available commands');
          break;
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

// Handle readline close
rl.on('close', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

// Start the interactive client
main().catch((error) => {
  console.error(`💥 Fatal error: ${error.message}`);
  process.exit(1);
});