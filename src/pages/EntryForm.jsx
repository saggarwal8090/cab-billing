import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Calculator, FileText, ClipboardList, AlertCircle, Hash, DollarSign } from 'lucide-react';
import { api as axios } from '../utils/api';
import { calculateTripFare, calculateGrandTotal, getHaltRecommendation } from '../utils/calculations';

const EntryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  
  const [formData, setFormData] = useState({
    billNumber: '',
    customerName: '',
    clientCompany: '',
    deptName: '',
    managedBy: '',
    date: new Date().toISOString().split('T')[0],
    taxRate: 0,
    discount: 0,
    advancePaid: 0,
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

  const [totals, setTotals] = useState({
    subtotal: 0,
    extraChargesTotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    grandTotal: 0,
    advancePaid: 0,
    balanceDue: 0
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (id) {
      fetchRecord();
    } else {
      generateDefaultBillNumber();
    }
  }, [id]);

  const generateDefaultBillNumber = async () => {
    try {
      const res = await axios.get('/api/records');
      const records = res.data || [];
      const nextId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
      const defaultBillNo = `PTC-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;
      setFormData(prev => ({ ...prev, billNumber: prev.billNumber || defaultBillNo }));
    } catch (err) {
      console.error('Failed to generate bill number:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setSettings({ rates: {}, minKmPerDay: 250, applyMinKm: false }); 
    }
  };

  const fetchRecord = async () => {
    try {
      const res = await axios.get(`/api/records/${id}`);
      const data = res.data;
      setFormData({
        billNumber: data.billNumber || '',
        customerName: data.customerName || '',
        clientCompany: data.clientCompany || '',
        deptName: data.deptName || '',
        managedBy: data.managedBy || '',
        date: data.date || new Date().toISOString().split('T')[0],
        taxRate: data.taxRate || 0,
        discount: data.discount || 0,
        advancePaid: data.advancePaid || 0,
        notes: data.notes || '',
        applyMinKm: data.applyMinKm ?? true
      });
      if (data.trips && data.trips.length > 0) {
        setTrips(data.trips);
      }
    } catch (err) {
      console.error('Failed to load record:', err);
      alert('Error loading record for editing.');
    }
  };

  useEffect(() => {
    if (!settings) return;
    const updatedTrips = trips.map(trip => {
      const results = calculateTripFare(trip, settings.rates, { ...settings, applyMinKm: formData.applyMinKm });
      return { ...trip, ...results };
    });
    setTotals(calculateGrandTotal(updatedTrips, {
      taxRate: formData.taxRate,
      discount: formData.discount,
      advancePaid: formData.advancePaid
    }));
  }, [trips, settings, formData.applyMinKm, formData.taxRate, formData.discount, formData.advancePaid]);

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
    
    const results = calculateTripFare(newTrips[index], settings.rates, { ...settings, applyMinKm: formData.applyMinKm });
    newTrips[index] = { ...newTrips[index], ...results };
    
    setTrips(newTrips);
  };

  const haltRec = getHaltRecommendation(trips.length);

  const handleSave = async (type) => {
    if (!formData.customerName && !formData.clientCompany) {
      if (!window.confirm('Customer Name / Client Company is empty. Do you want to proceed saving?')) {
        return;
      }
    }

    const payload = {
      ...formData,
      type, // 'bill' or 'summary'
      ...totals,
      trips
    };

    try {
      let res;
      if (id) {
        res = await axios.put(`/api/records/${id}`, payload);
      } else {
        res = await axios.post('/api/records', payload);
      }
      navigate(`/preview/${res.data.id}`);
    } catch (err) {
      console.error('SAVE ERROR:', err.response?.data || err);
      alert(`Error saving record: ${err.response?.data?.error || err.message}`);
    }
  };

  if (!settings) return <div style={{ padding: '2rem' }}>Loading application settings...</div>;

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>{id ? 'Edit Trip Entry' : 'New Trip Entry'}</h1>
          <p style={{ color: 'var(--text-light)' }}>Enter bill information and detailed trip logs below.</p>
        </div>
        <div className="card" style={{ padding: '0.8rem 1.5rem', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '1.5rem', borderRadius: '12px' }}>
          <div>
            <p style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grand Total</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>₹{totals.grandTotal.toLocaleString()}</h2>
          </div>
          {totals.balanceDue !== totals.grandTotal && (
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '1rem' }}>
              <p style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Balance Due</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fef08a' }}>₹{totals.balanceDue.toLocaleString()}</h2>
            </div>
          )}
          <Calculator size={28} />
        </div>
      </div>

      {/* Bill & Header Info Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: 'var(--primary)', fontWeight: '700' }}>
          <Hash size={20} />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Bill & Client Details (Fully Editable)</h3>
        </div>

        <div className="grid grid-4" style={{ gap: '1rem' }}>
          <div className="input-group">
            <label style={{ fontWeight: '600', color: 'var(--primary)' }}>Bill Number *</label>
            <input 
              type="text" 
              value={formData.billNumber} 
              onChange={e => setFormData({...formData, billNumber: e.target.value})} 
              placeholder="e.g. PTC-2026-0001" 
              style={{ fontWeight: '600', borderColor: 'var(--primary)' }}
            />
          </div>
          <div className="input-group">
            <label>Bill / Start Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Contact Person / Customer</label>
            <input type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="e.g. John Doe" />
          </div>
          <div className="input-group">
            <label>Client Company Name</label>
            <input type="text" value={formData.clientCompany} onChange={e => setFormData({...formData, clientCompany: e.target.value})} placeholder="e.g. Acme Corporation" />
          </div>
        </div>

        <div className="grid grid-4" style={{ gap: '1rem', marginTop: '0.5rem' }}>
          <div className="input-group">
            <label>Department</label>
            <input type="text" value={formData.deptName} onChange={e => setFormData({...formData, deptName: e.target.value})} placeholder="e.g. Marketing / Operations" />
          </div>
          <div className="input-group">
            <label>Managed By</label>
            <input type="text" value={formData.managedBy} onChange={e => setFormData({...formData, managedBy: e.target.value})} placeholder="e.g. Manager Name" />
          </div>
          <div className="input-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <input 
              type="checkbox" 
              checked={formData.applyMinKm} 
              onChange={e => setFormData({...formData, applyMinKm: e.target.checked})} 
              style={{ width: 'auto' }}
              id="applyMinKmCheck"
            />
            <label htmlFor="applyMinKmCheck" style={{ margin: 0, cursor: 'pointer', fontSize: '0.9rem' }}>
              Apply Min KM Rule ({settings.minKmPerDay} KM/day for Outstation)
            </label>
          </div>
        </div>

        {haltRec.eligible && (
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.85rem', fontWeight: '500' }}>
            <AlertCircle size={16} /> {haltRec.message}
          </div>
        )}
      </div>

      {/* Trip Log Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: '700', marginBottom: '1rem', color: '#0f172a' }}>Multi-Trip Entry Logs</h3>
        {trips.map((trip, index) => (
          <div key={trip.id} className="card" style={{ marginBottom: '1.5rem', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)', fontWeight: '700' }}>TRIP LOG #{index + 1}</h4>
              {trips.length > 1 && (
                <button onClick={() => removeTrip(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                  <Trash2 size={16} /> Remove Trip
                </button>
              )}
            </div>
            
            <div className="grid grid-4" style={{ gap: '0.8rem' }}>
              <div className="input-group">
                <label>Passenger Name</label>
                <input type="text" placeholder="e.g. Rahul Sharma" value={trip.passengerName} onChange={e => updateTrip(index, 'passengerName', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Vehicle Number</label>
                <input type="text" placeholder="e.g. MH 12 AB 1234" value={trip.vehicleNumber} onChange={e => updateTrip(index, 'vehicleNumber', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Car Type</label>
                <select value={trip.carType} onChange={e => handleCarTypeChange(index, e.target.value)}>
                  <option value="">Select Vehicle Type</option>
                  {Object.keys(settings.rates || {}).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Trip Type</label>
                <select value={trip.tripType} onChange={e => updateTrip(index, 'tripType', e.target.value)}>
                  <option value="Local">Local</option>
                  <option value="Outstation">Outstation</option>
                  <option value="Multi Day">Multi Day Trip</option>
                  <option value="Cancelled">Cancelled Trip</option>
                </select>
              </div>
            </div>

            <div className="grid grid-4" style={{ gap: '0.8rem' }}>
              <div className="input-group">
                <label>Trip Date</label>
                <input type="date" value={trip.tripDate} onChange={e => updateTrip(index, 'tripDate', e.target.value)} />
              </div>
              {trip.tripType !== 'Cancelled' && (
                <>
                  <div className="input-group">
                    <label>From (Origin)</label>
                    <input type="text" placeholder="e.g. Pune" value={trip.fromLoc} onChange={e => updateTrip(index, 'fromLoc', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>To (Destination)</label>
                    <input type="text" placeholder="e.g. Mumbai" value={trip.toLoc} onChange={e => updateTrip(index, 'toLoc', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Rate per KM (₹)</label>
                    <input type="number" placeholder="12" value={trip.rate} onChange={e => updateTrip(index, 'rate', e.target.value)} />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-4" style={{ gap: '0.8rem' }}>
              <div className="input-group">
                <label>Opening KM</label>
                <input type="number" placeholder="0" value={trip.openingKm} onChange={e => updateTrip(index, 'openingKm', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Closing KM</label>
                <input type="number" placeholder="0" value={trip.closingKm} onChange={e => updateTrip(index, 'closingKm', e.target.value)} />
              </div>
              <div className="input-group">
                <label style={{ color: 'var(--text-light)' }}>Total / Billable KM</label>
                <input type="text" value={`${trip.totalKm || 0} km (Billable: ${trip.billableKm || 0})`} disabled style={{ background: '#f8fafc', fontWeight: '600' }} />
              </div>
              <div className="input-group">
                <label style={{ color: 'var(--primary)', fontWeight: '600' }}>Base Fare</label>
                <input type="text" value={`₹${(trip.baseFare || 0).toLocaleString()}`} disabled style={{ background: '#eff6ff', fontWeight: '700', color: 'var(--primary)' }} />
              </div>
            </div>

            {trip.tripType !== 'Cancelled' && (
              <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.8rem' }}>Optional Extra Charges (Leave 0 if none)</p>
                <div className="grid grid-5" style={{ gap: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>DA Charges</label>
                    <input type="number" placeholder="0" value={trip.da} onChange={e => updateTrip(index, 'da', e.target.value)} />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Night Halt</label>
                    <input type="number" placeholder="0" value={trip.nightCharges} onChange={e => updateTrip(index, 'nightCharges', e.target.value)} />
                  </div>
                  {trip.tripType === 'Multi Day' && (
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Whole Night</label>
                      <input type="number" placeholder="0" value={trip.wholeNightCharges} onChange={e => updateTrip(index, 'wholeNightCharges', e.target.value)} />
                    </div>
                  )}
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Toll Fees</label>
                    <input type="number" placeholder="0" value={trip.toll} onChange={e => updateTrip(index, 'toll', e.target.value)} />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Parking Fees</label>
                    <input type="number" placeholder="0" value={trip.parking} onChange={e => updateTrip(index, 'parking', e.target.value)} />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Extra Charges</label>
                    <input type="number" placeholder="0" value={trip.extraCharges} onChange={e => updateTrip(index, 'extraCharges', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: '1rem', marginTop: '0.8rem' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Specific Trip Remarks</label>
                    <input type="text" placeholder="e.g. Airport Parking / Extra hour halt" value={trip.remarks} onChange={e => updateTrip(index, 'remarks', e.target.value)} />
                  </div>
                  <div className="input-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
                    <input 
                      type="checkbox" 
                      checked={trip.isHaltDay} 
                      onChange={e => updateTrip(index, 'isHaltDay', e.target.checked)} 
                      style={{ width: 'auto' }}
                      id={`haltCheck_${index}`}
                    />
                    <label htmlFor={`haltCheck_${index}`} style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem' }}>Halt Day (No Min KM applied)</label>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={addTrip} className="btn btn-secondary" style={{ width: '100%', border: '2px dashed var(--primary)', padding: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>
          <Plus size={18} /> Add Another Trip Log
        </button>
      </div>

      {/* Taxes, Discounts & Advance Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: '700' }}>
          <DollarSign size={20} />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Taxes, Adjustments & Advance Payment</h3>
        </div>

        <div className="grid grid-3" style={{ gap: '1rem' }}>
          <div className="input-group">
            <label>GST / Tax Rate (%)</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              step="0.5" 
              placeholder="0 (e.g. 5% or 18%)" 
              value={formData.taxRate} 
              onChange={e => setFormData({...formData, taxRate: e.target.value})} 
            />
          </div>
          <div className="input-group">
            <label>Discount Amount (₹)</label>
            <input 
              type="number" 
              min="0" 
              placeholder="0" 
              value={formData.discount} 
              onChange={e => setFormData({...formData, discount: e.target.value})} 
            />
          </div>
          <div className="input-group">
            <label>Advance Amount Paid (₹)</label>
            <input 
              type="number" 
              min="0" 
              placeholder="0" 
              value={formData.advancePaid} 
              onChange={e => setFormData({...formData, advancePaid: e.target.value})} 
            />
          </div>
        </div>

        {/* Live Financial Breakdown Summary */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem' }}>
            <div>Base Subtotal: <strong>₹{totals.subtotal.toLocaleString()}</strong></div>
            <div>Extra Charges: <strong>₹{totals.extraChargesTotal.toLocaleString()}</strong></div>
            {totals.discount > 0 && <div style={{ color: 'var(--danger)' }}>Discount: <strong>-₹{totals.discount.toLocaleString()}</strong></div>}
            {totals.taxAmount > 0 && <div style={{ color: 'var(--primary)' }}>Tax ({totals.taxRate}%): <strong>+₹{totals.taxAmount.toLocaleString()}</strong></div>}
            <div>Grand Total: <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>₹{totals.grandTotal.toLocaleString()}</strong></div>
            {totals.advancePaid > 0 && <div>Advance Paid: <strong style={{ color: 'var(--success)' }}>₹{totals.advancePaid.toLocaleString()}</strong></div>}
            {totals.balanceDue > 0 && <div>Balance Due: <strong style={{ color: '#d97706', fontSize: '1.05rem' }}>₹{totals.balanceDue.toLocaleString()}</strong></div>}
          </div>
        </div>
      </div>

      {/* Remarks / Notes */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.8rem', fontWeight: '600' }}>Overall Invoice Notes / Terms</h3>
        <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Add any special instructions, payment terms, or notes..."></textarea>
      </div>

      {/* Save Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '4rem' }}>
        <button className="btn btn-secondary" onClick={() => handleSave('summary')} style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
          <ClipboardList size={18} /> Save as Summary Only
        </button>
        <button className="btn btn-primary" onClick={() => handleSave('bill')} style={{ padding: '0.8rem 2.5rem', fontSize: '1.05rem', fontWeight: '600' }}>
          <FileText size={20} /> Save & Generate Bill
        </button>
      </div>
    </div>
  );
};

export default EntryForm;
