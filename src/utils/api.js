// LocalStorage based mock API
// This completely replaces the Vercel serverless backend to ensure 100% 
// state persistence across page loads without needing a real database.

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const getDB = () => {
  const db = localStorage.getItem('cabBillingDB');
  if (db) return JSON.parse(db);
  
  // Default Initial DB
  const initial = {
    settings: {
      id: 1,
      companyName: 'Parvati Trading Co.',
      address: '',
      contact: '',
      signatureText: 'Authorized Signatory',
      footerNote: 'Thank you for choosing Parvati Trading Co.',
      minKmPerDay: 250,
      nightHaltStartDay: 2,
      rates: {
        'Sedan / Dzire': 12,
        'Innova': 16,
        'Ertiga': 14,
        'Crysta': 20,
        'Local Fixed': 2500
      }
    },
    records: []
  };
  localStorage.setItem('cabBillingDB', JSON.stringify(initial));
  return initial;
};

const saveDB = (db) => localStorage.setItem('cabBillingDB', JSON.stringify(db));

export const api = {
  get: async (url) => {
    await delay(50); // fake network delay
    const db = getDB();
    
    if (url === '/api/settings') {
      return { data: db.settings };
    }
    
    if (url === '/api/records') {
      return { data: db.records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) };
    }
    
    if (url.startsWith('/api/records/')) {
      const id = parseInt(url.split('/').pop());
      const record = db.records.find(r => r.id === id);
      if (!record) throw { response: { data: { error: 'Record not found' } } };
      return { data: record };
    }
    
    throw { response: { data: { error: 'Route not found' } } };
  },
  
  post: async (url, payload) => {
    await delay(50);
    const db = getDB();
    
    if (url === '/api/settings') {
      db.settings = { ...db.settings, ...payload };
      saveDB(db);
      return { data: { success: true } };
    }
    
    if (url === '/api/records') {
      const nextId = db.records.length > 0 ? Math.max(...db.records.map(r => r.id)) + 1 : 1;
      const billNumber = payload.type === 'bill' 
        ? `PTC-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`
        : null;
      
      const newRecord = {
        ...payload,
        id: nextId,
        billNumber,
        date: payload.date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      
      db.records.push(newRecord);
      saveDB(db);
      return { data: { success: true, id: nextId, billNumber } };
    }
    
    throw { response: { data: { error: 'Route not found' } } };
  },

  put: async (url, payload) => {
    await delay(50);
    const db = getDB();
    
    if (url.startsWith('/api/records/')) {
      const id = parseInt(url.split('/').pop());
      const index = db.records.findIndex(r => r.id === id);
      if (index === -1) throw { response: { data: { error: 'Record not found' } } };
      
      db.records[index] = { 
        ...db.records[index], 
        ...payload, 
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString() 
      };
      saveDB(db);
      return { data: { success: true, id } };
    }
    
    throw { response: { data: { error: 'Route not found' } } };
  },
  
  delete: async (url) => {
    await delay(50);
    const db = getDB();
    
    if (url.startsWith('/api/records/')) {
      const id = parseInt(url.split('/').pop());
      db.records = db.records.filter(r => r.id !== id);
      saveDB(db);
      return { data: { success: true } };
    }
    
    throw { response: { data: { error: 'Route not found' } } };
  }
};
