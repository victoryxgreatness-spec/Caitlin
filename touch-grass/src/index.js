#!/usr/bin/env node
'use strict';

// Touch Grass — outdoor check-in app
// Entry point: handles CLI commands

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
Touch Grass — get outside, log your adventures

Usage: node src/index.js <command> [options]

Commands:
  check-in   --location <name> [--note <text>]   Log an outdoor check-in
  list       [--limit <n>]                        Show recent check-ins
  help                                            Show this help message
`);
}

switch (command) {
  case 'check-in':
    console.log('check-in command — not yet implemented');
    break;
  case 'list':
    console.log('list command — not yet implemented');
    break;
  case 'help':
  default:
    printHelp();
}
