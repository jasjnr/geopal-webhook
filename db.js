const Database = require('better-sqlite3');
const db = new Database('jobs.db');

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    lat REAL,
    lng REAL,
    address TEXT,
    status TEXT,
    completed_at TEXT,
    inspector TEXT
  )
`);

module.exports = db;
