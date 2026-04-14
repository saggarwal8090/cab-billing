const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

let dbPromise = initDB().then(database => {
  console.log('Database initialized');
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
  return database;
}).catch(err => {
  console.error('Failed to initialize database', err);
});

module.exports = app;

// Settings Endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const db = await dbPromise;
    const settings = await db.get('SELECT * FROM settings LIMIT 1');
    settings.rates = JSON.parse(settings.rates);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', async (req, res) => {
  const { companyName, address, contact, signatureText, footerNote, minKmPerDay, nightHaltStartDay, rates } = req.body;
  try {
    const db = await dbPromise;
    await db.run(`
      UPDATE settings SET 
        companyName = ?, address = ?, contact = ?, 
        signatureText = ?, footerNote = ?, 
        minKmPerDay = ?, nightHaltStartDay = ?,
        rates = ?
      WHERE id = 1
    `, [companyName, address, contact, signatureText, footerNote, minKmPerDay, nightHaltStartDay, JSON.stringify(rates)]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Records Endpoints
app.get('/api/records', async (req, res) => {
  try {
    const db = await dbPromise;
    const records = await db.all('SELECT * FROM records ORDER BY createdAt DESC');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/records/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    const record = await db.get('SELECT * FROM records WHERE id = ?', [req.params.id]);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    const trips = await db.all('SELECT * FROM trips WHERE recordId = ?', [req.params.id]);
    res.json({ ...record, trips });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/records', async (req, res) => {
  const { 
    type, customerName, clientCompany, deptName, date,
    subtotal, extraChargesTotal, grandTotal, notes, trips 
  } = req.body;

  try {
    const db = await dbPromise;
    // Generate Bill Number if type is bill
    let billNumber = null;
    if (type === 'bill') {
      const lastRecord = await db.get('SELECT id FROM records ORDER BY id DESC LIMIT 1');
      const nextId = (lastRecord ? lastRecord.id : 0) + 1;
      billNumber = `PTC-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;
    }

    const result = await db.run(`
      INSERT INTO records (
        billNumber, type, customerName, clientCompany, deptName, date,
        subtotal, extraChargesTotal, grandTotal, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [billNumber, type, customerName, clientCompany, deptName, date, subtotal, extraChargesTotal, grandTotal, notes]);

    const recordId = result.lastID;

    // Insert Trips
    for (const trip of trips) {
      await db.run(`
        INSERT INTO trips (
          recordId, passengerName, tripDate, vehicleNumber, carType, tripType, fromLoc, toLoc, openingKm, closingKm,
          totalKm, billableKm, rate, baseFare, da, nightCharges,
          wholeNightCharges, toll, parking, extraCharges, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        recordId, trip.passengerName, trip.tripDate, trip.vehicleNumber, trip.carType, trip.tripType, trip.fromLoc, trip.toLoc, trip.openingKm, trip.closingKm,
        trip.totalKm, trip.billableKm, trip.rate, trip.baseFare, trip.da, trip.nightCharges,
        trip.wholeNightCharges, trip.toll, trip.parking, trip.extraCharges, trip.remarks
      ]);
    }

    res.json({ success: true, id: recordId, billNumber });
  } catch (error) {
    console.error('SAVE ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/records/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM records WHERE id = ?', [req.params.id]);
    await db.run('DELETE FROM trips WHERE recordId = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
