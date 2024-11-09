const path = require('path');
const fs = require('fs');

console.log('Starting migration process...');

// Backup the current database
const backupFile = `database.sqlite.backup-${Date.now()}`;
fs.copyFileSync('database.sqlite', backupFile);
console.log(`Database backed up to ${backupFile}`);

// Run the migration
require('./migrations.js'); 