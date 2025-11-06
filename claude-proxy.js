#!/usr/bin/env node

/**
 * Claude API Proxy Server
 * 
 * This creates a local CORS-enabled proxy to the Claude API.
 * Users download this file and run: node claude-proxy.js
 * Then their browser can make requests to localhost:3001 without CORS issues.
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;
const CLAUDE_API_BASE = 'api.anthropic.com';

// Create the proxy server
const server = http.createServer((req, res) => {
    // Enable CORS for all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Only handle POST requests to /claude-proxy
    if (req.method !== 'POST' || req.url !== '/claude-proxy') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found. Use POST /claude-proxy' }));
        return;
    }

    // Collect request body
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const requestData = JSON.parse(body);
            const { apiKey, messages, model = 'claude-3-sonnet-20240229', max_tokens = 1000 } = requestData;

            if (!apiKey) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'API key is required' }));
                return;
            }

            if (!messages || !Array.isArray(messages)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Messages array is required' }));
                return;
            }

            // Prepare the request to Claude API
            const claudeRequestData = JSON.stringify({
                model,
                max_tokens,
                messages
            });

            const options = {
                hostname: CLAUDE_API_BASE,
                port: 443,
                path: '/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Length': Buffer.byteLength(claudeRequestData)
                }
            };

            // Make request to Claude API
            const claudeReq = https.request(options, (claudeRes) => {
                let responseData = '';

                claudeRes.on('data', (chunk) => {
                    responseData += chunk;
                });

                claudeRes.on('end', () => {
                    // Forward the response status and headers
                    res.writeHead(claudeRes.statusCode, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(responseData);
                });
            });

            claudeReq.on('error', (error) => {
                console.error('Error proxying to Claude API:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Proxy error', 
                    details: error.message 
                }));
            });

            // Send the request data
            claudeReq.write(claudeRequestData);
            claudeReq.end();

        } catch (error) {
            console.error('Error parsing request:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Invalid JSON in request body',
                details: error.message 
            }));
        }
    });
});

// Start the server
server.listen(PORT, 'localhost', () => {
    console.log('🚀 Claude API Proxy Server Started!');
    console.log(`📡 Server running at: http://localhost:${PORT}`);
    console.log(`🔗 Proxy endpoint: http://localhost:${PORT}/claude-proxy`);
    console.log('');
    console.log('✅ CORS enabled for all origins');
    console.log('✅ Ready to proxy requests to Claude API');
    console.log('');
    console.log('💡 Usage:');
    console.log('   1. Keep this server running');
    console.log('   2. Open your workflow HTML file in a browser');
    console.log('   3. Enter your Claude API key in the interface');
    console.log('   4. Start classifying images!');
    console.log('');
    console.log('🛑 Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Claude API Proxy Server...');
    server.close(() => {
        console.log('✅ Server stopped gracefully');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});