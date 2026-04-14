import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Info } from 'lucide-react';
import axios from 'axios';

const Settings = () => {
  const [settings, setSettings] = useState({
    companyName: 'Parvati Trading Co.',
    address: '',
    contact: '',
    signatureText: 'Authorized Signatory',
    footerNote: 'Thank you for choosing Parvati Trading Co.',
    minKmPerDay: 250,
    nightHaltStartDay: 2,
    rates: {}
  });
  const [newVehicle, setNewVehicle] = useState('');
  const [newRate, setNewRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/settings', settings);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const addRate = () => {
    if (!newVehicle || !newRate) return;
    setSettings({
      ...settings,
      rates: { ...settings.rates, [newVehicle]: Number(newRate) }
    });
    setNewVehicle('');
    setNewRate('');
  };

  const removeRate = (vehicle) => {
    const newRates = { ...settings.rates };
    delete newRates[vehicle];
    setSettings({ ...settings, rates: newRates });
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>System Settings</h1>
        <p style={{ color: 'var(--text-light)' }}>Configure business rules, rates, and company details.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Company Information</h3>
          <div className="input-group">
            <label>Company Name</label>
            <input 
              type="text" 
              value={settings.companyName} 
              onChange={e => setSettings({...settings, companyName: e.target.value})} 
            />
          </div>
          <div className="input-group">
            <label>Address</label>
            <textarea 
              rows="3" 
              value={settings.address} 
              onChange={e => setSettings({...settings, address: e.target.value})}
            ></textarea>
          </div>
          <div className="input-group">
            <label>Contact Details</label>
            <input 
              type="text" 
              value={settings.contact} 
              onChange={e => setSettings({...settings, contact: e.target.value})} 
            />
          </div>
          <div className="input-group">
            <label>Signature Text</label>
            <input 
              type="text" 
              value={settings.signatureText} 
              onChange={e => setSettings({...settings, signatureText: e.target.value})} 
            />
          </div>
          <div className="input-group">
            <label>Footer Note (on Bill)</label>
            <input 
              type="text" 
              value={settings.footerNote} 
              onChange={e => setSettings({...settings, footerNote: e.target.value})} 
            />
          </div>
        </div>

        <div className="grid" style={{ gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Billing Rules</h3>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <div className="input-group">
                <label>Min KM per Day</label>
                <input 
                  type="number" 
                  value={settings.minKmPerDay} 
                  onChange={e => setSettings({...settings, minKmPerDay: Number(e.target.value)})} 
                />
              </div>
              <div className="input-group">
                <label>Halt Rule (Start Day)</label>
                <input 
                  type="number" 
                  value={settings.nightHaltStartDay} 
                  onChange={e => setSettings({...settings, nightHaltStartDay: Number(e.target.value)})} 
                />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '-0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Info size={12} /> Minimum KM usually 250 for outstation.
            </p>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.2rem', fontWeight: '600' }}>Vehicle Rates (per KM)</h3>
            <div className="grid grid-2" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Vehicle Type (e.g. Innova)" 
                value={newVehicle} 
                onChange={e => setNewVehicle(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  placeholder="Rate" 
                  value={newRate} 
                  onChange={e => setNewRate(e.target.value)}
                />
                <button type="button" onClick={addRate} className="btn btn-primary" style={{ padding: '0 1rem' }}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {Object.entries(settings.rates).map(([vehicle, rate]) => (
                <div key={vehicle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{vehicle}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>₹{rate}</span>
                    <button type="button" onClick={() => removeRate(vehicle)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 2', textAlign: 'right', marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
