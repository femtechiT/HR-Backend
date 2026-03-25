/**
 * Production entry point for cPanel
 * Uses tsx to run TypeScript source directly
 */

// Set production environment
process.env.NODE_ENV = 'production';

// Use tsx to run TypeScript directly
require('tsx/cjs');

// Import and start the server
const path = require('path');
require(path.join(__dirname, 'src', 'index.ts'));
