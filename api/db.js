const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function initDB() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const dbPath = isProd 
    ? '/tmp/database.sqlite' 
    : path.join(__dirname, 'database.sqlite');
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Settings Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      companyName TEXT DEFAULT 'Parvati Trading Co.',
      address TEXT DEFAULT '',
      contact TEXT DEFAULT '',
      signatureText TEXT DEFAULT 'Authorized Signatory',
      footerNote TEXT DEFAULT 'Thank you for choosing Parvati Trading Co.',
      minKmPerDay INTEGER DEFAULT 250,
      nightHaltStartDay INTEGER DEFAULT 2,
      rates TEXT DEFAULT '{}'
    )
  `);

  // Default Settings if not exists
  const settingsCount = await db.get('SELECT COUNT(*) as count FROM settings');
  if (settingsCount.count === 0) {
    const defaultRates = JSON.stringify({
      'Sedan / Dzire': 12,
      'Innova': 16,
      'Ertiga': 14,
      'Crysta': 20,
      'Local Fixed': 2500
    });
    await db.run(`
      INSERT INTO settings (companyName, rates) 
      VALUES ('Parvati Trading Co.', ?)
    `, [defaultRates]);
  }

  // Records Table (Bills/Summaries)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      billNumber TEXT UNIQUE,
      type TEXT, -- 'bill' or 'summary'
      customerName TEXT, -- This could be the Contact Person or Client
      clientCompany TEXT, -- New: Client Company Name
      deptName TEXT,      -- New: Department Name
      date TEXT,
      subtotal REAL,
      extraChargesTotal REAL,
      grandTotal REAL,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Trips Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recordId INTEGER,
      passengerName TEXT,
      tripDate TEXT,
      vehicleNumber TEXT,
      carType TEXT,
      tripType TEXT,
      fromLoc TEXT,
      toLoc TEXT,
      openingKm REAL,
      closingKm REAL,
      totalKm REAL,
      billableKm REAL,
      rate REAL,
      baseFare REAL,
      da REAL DEFAULT 0,
      nightCharges REAL DEFAULT 0,
      wholeNightCharges REAL DEFAULT 0,
      toll REAL DEFAULT 0,
      parking REAL DEFAULT 0,
      extraCharges REAL DEFAULT 0,
      remarks TEXT,
      FOREIGN KEY(recordId) REFERENCES records(id) ON DELETE CASCADE
    )
  `);

  // Enable WAL mode for better concurrency and fewer locks on Mac
  await db.exec('PRAGMA journal_mode = WAL;');

  return db;
}

module.exports = { initDB };
