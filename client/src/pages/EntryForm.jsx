import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Calculator, Save, FileText, ClipboardList, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { calculateTripFare, calculateGrandTotal, getHaltRecommendation } from '../utils/calculations';

const EntryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    clientCompany: '',
    deptName: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    applyMinKm: true
  });

  const [trips, setTrips] = useState([
    { 
      id: Date.now(), 
      passengerName: '',
      tripDate: new Date().toISOString().split('T')[0], 
      vehicleNumber: '',
      carType: '',
      tripType: 'Outstation',
      fromLoc: '', toLoc: '', openingKm: '', closingKm: '', 
      rate: '', da: 0, nightCharges: 0, wholeNightCharges: 0, 
      toll: 0, parking: 0, extraCharges: 0, remarks: '',
      isHaltDay: false
    }
  ]);

  const [totals, setTotals] = useState({ subtotal: 0, extraChargesTotal: 0, grandTotal: 0 });

  useEffect(() => {
    fetchSettings();
    if (id) fetchRecord();
  }, [id]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecord = async () => {
    // Implementation for edit mode if needed
  };

  useEffect(() => {
    if (!settings) return;
    const updatedTrips = trips.map(trip => {
      const results = calculateTripFare(trip, settings.rates, { ...settings, applyMinKm: formData.applyMinKm });
      return { ...trip, ...results };
    });
    // We don't setTrips here to avoid loop, but we do set totals
    setTotals(calculateGrandTotal(updatedTrips));
  }, [trips, settings, formData.applyMinKm]);

  const addTrip = () => {
    const lastTrip = trips[trips.length - 1];
    setTrips([...trips, { 
      id: Date.now(), 
      passengerName: '',
      tripDate: lastTrip ? lastTrip.tripDate : new Date().toISOString().split('T')[0],
      vehicleNumber: lastTrip ? lastTrip.vehicleNumber : '',
      carType: lastTrip ? lastTrip.carType : '',
      tripType: lastTrip ? lastTrip.tripType : 'Outstation',
      fromLoc: '', toLoc: '', 
      openingKm: lastTrip ? lastTrip.closingKm : '', 
      closingKm: '',
      rate: lastTrip ? lastTrip.rate : '',
      da: 0, nightCharges: 0, wholeNightCharges: 0, toll: 0, parking: 0, extraCharges: 0, remarks: '',
      isHaltDay: false
    }]);
  };

  const removeTrip = (index) => {
    if (trips.length === 1) return;
    const newTrips = [...trips];
    newTrips.splice(index, 1);
    setTrips(newTrips);
  };

  const updateTrip = (index, field, value) => {
    const newTrips = [...trips];
    newTrips[index][field] = value;
    
    // Recalculate this specific trip immediately for real-time display
    if (settings) {
      const results = calculateTripFare(newTrips[index], settings.rates, { ...settings, applyMinKm: formData.applyMinKm });
      newTrips[index] = { ...newTrips[index], ...results };
    }
    
    setTrips(newTrips);
  };

  const handleCarTypeChange = (index, value) => {
    const rate = settings.rates[value] || 0;
    const newTrips = [...trips];
    newTrips[index].carType = value;
    newTrips[index].rate = rate;
    
    // Recalculate
    const results = calculateTripFare(newTrips[index], settings.rates, { ...settings, applyMinKm: formData.applyMinKm });
    newTrips[index] = { ...newTrips[index], ...results };
    
    setTrips(newTrips);
  };

  const haltRec = getHaltRecommendation(trips.length);

  const handleSave = async (type) => {
    if (!formData.customerName) {
      alert('Please fill customer details.');
      return;
    }

    const payload = {
      ...formData,
      type, // 'bill' or 'summary'
      ...totals,
      trips
    };

    console.log('SAVING PAYLOAD:', payload);

    try {
      const res = await axios.post('/api/records', payload);
      navigate(`/preview/${res.data.id}`);
    } catch (err) {
      console.error('FETCH ERROR:', err.response?.data || err);
      alert(`Error saving record: ${err.response?.data?.error || err.message}`);
    }
  };

  if (!settings) return <div style={{ padding: '2rem' }}>Loading application settings...</div>;

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>New Trip Entry</h1>
          <p style={{ color: 'var(--text-light)' }}>Enter customer details and trip logs below.</p>
        </div>
        <div className="card" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.7rem', opacity: 0.9, textTransform: 'uppercase' }}>Grand Total</p>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>₹{totals.grandTotal.toLocaleString()}</h2>
          </div>
          <Calculator size={24} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.2rem', fontWeight: '600' }}>Header Details</h3>
        <div className="grid grid-4" style={{ gap: '1rem' }}>
          <div className="input-group">
            <label>Contact Person</label>
            <input type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="e.g. John Doe" />
          </div>
          <div className="input-group">
            <label>Client Company</label>
            <input type="text" value={formData.clientCompany} onChange={e => setFormData({...formData, clientCompany: e.target.value})} placeholder="e.g. Acme Corp" />
          </div>
          <div className="input-group">
            <label>Department</label>
            <input type="text" value={formData.deptName} onChange={e => setFormData({...formData, deptName: e.target.value})} placeholder="e.g. Marketing" />
          </div>
          <div className="input-group">
            <label>Trip Start Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-3" style={{ gap: '1rem', marginTop: '0.5rem' }}>
          <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <input 
              type="checkbox" 
              checked={formData.applyMinKm} 
              onChange={e => setFormData({...formData, applyMinKm: e.target.checked})} 
              style={{ width: 'auto' }}
            />
            <label style={{ margin: 0 }}>Apply Min KM Rule ({settings.minKmPerDay} KM/day)</label>
          </div>
          {haltRec.eligible && (
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.85rem', fontWeight: '500' }}>
              <AlertCircle size={16} /> {haltRec.message}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Multi-Trip Entry</h3>
        {trips.map((trip, index) => (
          <div key={trip.id} className="card" style={{ marginBottom: '1.5rem', background: '#fcfdfe', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700' }}>TRIP #{index + 1}</h4>
              <button onClick={() => removeTrip(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="grid grid-4" style={{ gap: '0.8rem' }}>
              <div className="input-group">
                <label>Passenger</label>
                <input type="text" placeholder="Name" value={trip.passengerName} onChange={e => updateTrip(index, 'passengerName', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Vehicle #</label>
                <input type="text" placeholder="MH 12..." value={trip.vehicleNumber} onChange={e => updateTrip(index, 'vehicleNumber', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Car Type</label>
                <select value={trip.carType} onChange={e => handleCarTypeChange(index, e.target.value)}>
                  <option value="">Select</option>
                  {Object.keys(settings.rates).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Trip Type</label>
                <select value={trip.tripType} onChange={e => updateTrip(index, 'tripType', e.target.value)}>
                  <option value="Local">Local</option>
                  <option value="Outstation">Outstation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-4" style={{ gap: '0.8rem' }}>
              <div className="input-group">
                <label>Date</label>
                <input type="date" value={trip.tripDate} onChange={e => updateTrip(index, 'tripDate', e.target.value)} />
              </div>
              <div className="input-group">
                <label>From</label>
                <input type="text" placeholder="Origin" value={trip.fromLoc} onChange={e => updateTrip(index, 'fromLoc', e.target.value)} />
              </div>
              <div className="input-group">
                <label>To</label>
                <input type="text" placeholder="Destination" value={trip.toLoc} onChange={e => updateTrip(index, 'toLoc', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Rate / KM</label>
                <input type="number" value={trip.rate} onChange={e => updateTrip(index, 'rate', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-4" style={{ gap: '0.8rem' }}>
              <div className="input-group">
                <label>Opening KM</label>
                <input type="number" value={trip.openingKm} onChange={e => updateTrip(index, 'openingKm', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Closing KM</label>
                <input type="number" value={trip.closingKm} onChange={e => updateTrip(index, 'closingKm', e.target.value)} />
              </div>
              <div className="input-group" style={{ opacity: 0.7 }}>
                <label>Total KM</label>
                <input type="text" value={trip.totalKm || 0} disabled style={{ background: '#f8fafc' }} />
              </div>
              <div className="input-group">
                <label style={{ color: 'var(--primary)' }}>Base Fare</label>
                <input type="text" value={`₹${(trip.baseFare || 0).toLocaleString()}`} disabled style={{ background: '#f0f4ff', fontWeight: '700', color: 'var(--primary)' }} />
              </div>
            </div>

            <div className="grid grid-4" style={{ gap: '0.8rem' }}>
              <div className="input-group">
                <label>DA Charges</label>
                <input type="number" value={trip.da} onChange={e => updateTrip(index, 'da', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Night Charges</label>
                <input type="number" value={trip.nightCharges} onChange={e => updateTrip(index, 'nightCharges', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Toll / Parking</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                   <input type="number" placeholder="Toll" value={trip.toll} onChange={e => updateTrip(index, 'toll', e.target.value)} />
                   <input type="number" placeholder="Prk" value={trip.parking} onChange={e => updateTrip(index, 'parking', e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Extra / Remarks</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                   <input type="number" placeholder="Amt" value={trip.extraCharges} onChange={e => updateTrip(index, 'extraCharges', e.target.value)} />
                   <input type="text" placeholder="Note" value={trip.remarks} onChange={e => updateTrip(index, 'remarks', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
               <input 
                type="checkbox" 
                checked={trip.isHaltDay} 
                onChange={e => updateTrip(index, 'isHaltDay', e.target.checked)} 
                style={{ width: 'auto' }}
              />
              <label style={{ margin: 0, fontSize: '0.8rem' }}>This is a Halt Day (No Min KM applied for this specific trip)</label>
            </div>
          </div>
        ))}

        <button onClick={addTrip} className="btn btn-secondary" style={{ width: '100%', border: '2px dashed var(--border)', padding: '1rem' }}>
          <Plus size={18} /> Add Another Trip
        </button>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.2rem', fontWeight: '600' }}>Overall Remarks</h3>
        <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Add any final notes or signature details..."></textarea>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', marginBottom: '4rem' }}>
        <button className="btn btn-secondary" onClick={() => handleSave('summary')} style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
          <ClipboardList size={18} /> Generate Summary Only
        </button>
        <button className="btn btn-primary" onClick={() => handleSave('bill')} style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
          <FileText size={20} /> Generate & Save Bill
        </button>
      </div>
    </div>
  );
};

export default EntryForm;
