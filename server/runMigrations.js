const { exec } = require('child_process');
const path = require('path');

console.log('Starting database migration...');

// Backup the current database
const backupFile = `database.sqlite.backup-${Date.now()}`;
exec(`cp database.sqlite ${backupFile}`, (error) => {
  if (error) {
    console.error('Error creating backup:', error);
    return;
  }
  
  console.log(`Database backed up to ${backupFile}`);
  
  // Run the migrations
  require('./migrations.js');
}); 