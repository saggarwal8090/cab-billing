// In-Memory Database for Vercel Serverless
// This perfectly aligns with the requirement: "history for 1 hr max till the billing is done"
// It entirely eliminates SQLite lock errors, Vercel dependency build failures, and /tmp/ permission issues.

let memoryDB = {
  settings: [
    {
      id: 1,
      companyName: 'Parvati Trading Co.',
      address: '',
      contact: '',
      signatureText: 'Authorized Signatory',
      footerNote: 'Thank you for choosing Parvati Trading Co.',
      minKmPerDay: 250,
      nightHaltStartDay: 2,
      rates: JSON.stringify({
        'Sedan / Dzire': 12,
        'Innova': 16,
        'Ertiga': 14,
        'Crysta': 20,
        'Local Fixed': 2500
      })
    }
  ],
  records: [],
  trips: []
};

let recordIdCounter = 1;
let tripIdCounter = 1;

async function initDB() {
  // Return an asynchronous mock that responds exactly like the sqlite 'db' object.
  return {
    get: async (query, params = []) => {
      if (query.includes('FROM settings')) return memoryDB.settings[0];
      if (query.includes('FROM records WHERE id')) {
        return memoryDB.records.find(r => r.id === parseInt(params[0]));
      }
      if (query.includes('FROM records ORDER BY id DESC LIMIT 1')) {
        return memoryDB.records.length > 0 ? memoryDB.records[memoryDB.records.length - 1] : null;
      }
      return null;
    },
    all: async (query, params = []) => {
      if (query.includes('FROM records ORDER BY createdAt')) {
        return [...memoryDB.records].reverse();
      }
      if (query.includes('FROM trips WHERE recordId')) {
        return memoryDB.trips.filter(t => t.recordId === parseInt(params[0]));
      }
      return [];
    },
    run: async (query, params = []) => {
      if (query.includes('UPDATE settings')) {
        const s = memoryDB.settings[0];
        s.companyName = params[0]; s.address = params[1]; s.contact = params[2];
        s.signatureText = params[3]; s.footerNote = params[4]; s.minKmPerDay = params[5];
        s.nightHaltStartDay = params[6]; s.rates = params[7];
        return { changes: 1 };
      }
      if (query.includes('INSERT INTO records')) {
        const newRecord = {
          id: recordIdCounter++,
          billNumber: params[0], type: params[1], customerName: params[2],
          clientCompany: params[3], deptName: params[4], date: params[5],
          subtotal: params[6], extraChargesTotal: params[7], grandTotal: params[8], 
          notes: params[9], createdAt: new Date().toISOString()
        };
        memoryDB.records.push(newRecord);
        return { lastID: newRecord.id };
      }
      if (query.includes('INSERT INTO trips')) {
        const newTrip = {
          id: tripIdCounter++, recordId: params[0], passengerName: params[1], tripDate: params[2],
          vehicleNumber: params[3], carType: params[4], tripType: params[5], fromLoc: params[6],
          toLoc: params[7], openingKm: params[8], closingKm: params[9], totalKm: params[10],
          billableKm: params[11], rate: params[12], baseFare: params[13], da: params[14],
          nightCharges: params[15], wholeNightCharges: params[16], toll: params[17],
          parking: params[18], extraCharges: params[19], remarks: params[20]
        };
        memoryDB.trips.push(newTrip);
        return { lastID: newTrip.id };
      }
      if (query.includes('DELETE FROM records')) {
        memoryDB.records = memoryDB.records.filter(r => r.id !== parseInt(params[0]));
        return { changes: 1 };
      }
      if (query.includes('DELETE FROM trips')) {
        memoryDB.trips = memoryDB.trips.filter(t => t.recordId !== parseInt(params[0]));
        return { changes: 1 };
      }
    }
  };
}

module.exports = { initDB };
