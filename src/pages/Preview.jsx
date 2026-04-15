import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { api as axios } from '../utils/api';
import html2pdf from 'html2pdf.js';

const Preview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [recRes, setRes] = await Promise.all([
        axios.get(`/api/records/${id}`),
        axios.get('/api/settings')
      ]);
      setRecord(recRes.data);
      setSettings(setRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    const element = document.getElementById('printable-area');
    const opt = {
      margin: 0.5,
      filename: `${record.type}_${record.billNumber || record.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  if (!record || !settings) return <div style={{ padding: '2rem' }}>Loading report...</div>;

  const isBill = record.type === 'bill';

  return (
    <div className="animate-fade">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleDownload} className="btn btn-secondary" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
            <Download size={18} /> Download PDF
          </button>
          <button onClick={() => window.print()} className="btn btn-primary">
            <Printer size={18} /> Print Now
          </button>
        </div>
      </div>

      <div id="printable-area" className="card" style={{ padding: '3rem', maxWidth: '1000px', margin: '0 auto', minHeight: '11in' }}>
        {/* Header - Different for Bill vs Summary */}
        {isBill ? (
          <div style={{ borderBottom: '3px solid var(--primary)', paddingBottom: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ color: 'var(--primary)', fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.2rem' }}>{settings.companyName}</h1>
                <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>TRAVEL & CAB SERVICES</p>
                <div style={{ marginTop: '1rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} /> {settings.address}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> {settings.contact}</p>
                  {record.clientCompany && <p style={{ marginTop: '0.5rem', color: 'var(--text)' }}><strong>Client:</strong> {record.clientCompany} {record.deptName ? `(${record.deptName})` : ''}</p>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: '4px', marginBottom: '1rem' }}>
                   <h3 style={{ margin: 0 }}>TAX INVOICE</h3>
                </div>
                <p style={{ fontSize: '0.9rem' }}><strong>Bill No:</strong> {record.billNumber}</p>
                <p style={{ fontSize: '0.9rem' }}><strong>Date:</strong> {record.date}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Internal Trip Summary Report</h2>
            <p style={{ color: 'var(--text-light)' }}>{settings.companyName} - Trip Records & Logistics</p>
          </div>
        )}

        {/* Customer & Vehicle Info */}
        <div className="grid grid-2" style={{ marginBottom: '2.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px' }}>
          <div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Billed To / Customer</p>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{record.customerName}</h3>
            {record.clientCompany && <p style={{ fontSize: '1rem', fontWeight: '600' }}>{record.clientCompany}</p>}
            {record.deptName && <p style={{ fontSize: '0.9rem' }}>Dept: {record.deptName}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Reference</p>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{record.billNumber || `#${record.id}`}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{record.date}</p>
          </div>
        </div>

        {/* Trip Table */}
        <div style={{ marginBottom: '2.5rem' }}>
          <table style={{ minWidth: '100%', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--text)' }}>
                <th style={{ padding: '10px 5px', textAlign: 'left', background: 'none' }}>Passenger / Vehicle</th>
                <th style={{ padding: '10px 5px', textAlign: 'left', background: 'none' }}>Path / Date</th>
                <th style={{ padding: '10px 5px', textAlign: 'center', background: 'none' }}>Distance</th>
                <th style={{ padding: '10px 5px', textAlign: 'center', background: 'none' }}>Rate</th>
                <th style={{ padding: '10px 5px', textAlign: 'center', background: 'none' }}>Fare</th>
                <th style={{ padding: '10px 5px', textAlign: 'center', background: 'none' }}>Misc</th>
                <th style={{ padding: '10px 5px', textAlign: 'right', background: 'none' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {record.trips.map((trip, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px 5px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary)' }}>{trip.passengerName || 'N/A'}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{trip.vehicleNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{trip.carType} ({trip.tripType})</div>
                  </td>
                  <td style={{ padding: '15px 5px' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>{trip.tripDate}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{trip.fromLoc} to {trip.toLoc}</div>
                  </td>
                  <td style={{ padding: '15px 5px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '600' }}>{trip.billableKm} KM</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>({trip.openingKm}-{trip.closingKm})</div>
                  </td>
                  <td style={{ padding: '15px 5px', textAlign: 'center' }}>₹{trip.rate}</td>
                  <td style={{ padding: '15px 5px', textAlign: 'center' }}>₹{trip.baseFare}</td>
                  <td style={{ padding: '15px 5px', textAlign: 'center' }}>
                    ₹{trip.da + trip.nightCharges + trip.wholeNightCharges + trip.toll + trip.parking + trip.extraCharges}
                  </td>
                  <td style={{ padding: '15px 5px', textAlign: 'right', fontWeight: '700' }}>₹{trip.tripTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <span>Base Subtotal</span>
              <span style={{ fontWeight: '600' }}>₹{record.subtotal.toLocaleString()}</span>
            </div>

            {record.trips.reduce((acc, t) => acc + Number(t.da || 0), 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                <span>Total DA Charges</span>
                <span>₹{record.trips.reduce((acc, t) => acc + Number(t.da || 0), 0)}</span>
              </div>
            )}
            
            {(record.trips.reduce((acc, t) => acc + Number(t.nightCharges || 0) + Number(t.wholeNightCharges || 0), 0)) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                <span>Night Halt Charges</span>
                <span>₹{record.trips.reduce((acc, t) => acc + Number(t.nightCharges || 0) + Number(t.wholeNightCharges || 0), 0)}</span>
              </div>
            )}

            {record.trips.reduce((acc, t) => acc + Number(t.toll || 0) + Number(t.parking || 0), 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                <span>Toll & Parking</span>
                <span>₹{record.trips.reduce((acc, t) => acc + Number(t.toll || 0) + Number(t.parking || 0), 0)}</span>
              </div>
            )}

            {record.trips.reduce((acc, t) => acc + Number(t.extraCharges || 0), 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                <span>Other Extra Charges</span>
                <span>₹{record.trips.reduce((acc, t) => acc + Number(t.extraCharges || 0), 0)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
              <span>Grand Total</span>
              <span>₹{record.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto' }}>
          {record.notes && (
            <div style={{ marginBottom: '3rem', fontSize: '0.9rem', borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
              <p style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Remarks / Notes:</p>
              <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>{record.notes}</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', maxWidth: '60%' }}>
              <p><strong>Note:</strong> {settings.footerNote}</p>
              <p style={{ marginTop: '0.5rem' }}>This is a computer-generated document.</p>
            </div>
            <div style={{ textAlign: 'center', minWidth: '200px' }}>
              <div style={{ height: '60px' }}></div>
              <div style={{ borderTop: '1px solid var(--text)', paddingTop: '0.5rem', fontWeight: '700' }}>
                {settings.signatureText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
