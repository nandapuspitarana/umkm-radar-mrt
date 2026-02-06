#!/usr/bin/env node

import { spawn } from 'child_process';
import http from 'http';

const BACKEND_PORT = 3000;
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

// Check if backend is ready
function checkBackend() {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// Wait for backend to be ready
async function waitForBackend() {
    log('⏳ Waiting for backend to be ready...', colors.yellow);

    for (let i = 0; i < MAX_RETRIES; i++) {
        const isReady = await checkBackend();
        if (isReady) {
            log('✅ Backend is ready!', colors.green);
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }

    log('❌ Backend failed to start within timeout', colors.red);
    return false;
}

// Start a service
function startService(name, command, args, cwd) {
    log(`🚀 Starting ${name}...`, colors.cyan);

    const proc = spawn(command, args, {
        cwd,
        stdio: 'inherit',
        shell: true
    });

    proc.on('error', (err) => {
        log(`❌ Error starting ${name}: ${err.message}`, colors.red);
    });

    return proc;
}

// Main execution
async function main() {
    log('🎯 UMKM Radar MRT - Development Mode', colors.green);
    log('=====================================\n', colors.green);

    // Start backend first
    const backend = startService('Backend', 'npm', ['run', 'dev'], './backend');

    // Wait for backend to be ready
    const backendReady = await waitForBackend();

    if (!backendReady) {
        log('⚠️  Backend not ready, but continuing anyway...', colors.yellow);
    }

    // Start client and dashboard
    const client = startService('Client', 'npm', ['run', 'dev'], './client');
    const dashboard = startService('Dashboard', 'npm', ['run', 'dev'], './dashboard');

    log('\n✨ All services started!', colors.green);
    log('📍 URLs:', colors.cyan);
    log('   Backend:   http://localhost:3000');
    log('   Client:    http://localhost:8082');
    log('   Dashboard: http://localhost:8083\n');

    // Handle cleanup on exit
    const cleanup = () => {
        log('\n🛑 Shutting down services...', colors.yellow);
        backend.kill();
        client.kill();
        dashboard.kill();
        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
}

main().catch(err => {
    log(`❌ Fatal error: ${err.message}`, colors.red);
    process.exit(1);
});
