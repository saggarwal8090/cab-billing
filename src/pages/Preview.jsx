import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Mail, Phone, MapPin, Edit } from 'lucide-react';
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
          <button onClick={() => navigate(`/edit/${id}`)} className="btn btn-secondary" style={{ backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }}>
            <Edit size={18} /> Edit Bill
          </button>
          <button onClick={handleDownload} className="btn btn-secondary" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
            <Download size={18} /> Download PDF
          </button>
          <button onClick={() => window.print()} className="btn btn-primary">
            <Printer size={18} /> Print Now
          </button>
        </div>
      </div>

      <div id="printable-area" className="card" style={{ padding: '1.5rem 2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '11in' }}>
        {/* Header - Different for Bill vs Summary */}
        {isBill ? (
          <div style={{ borderBottom: '3px solid var(--primary)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ color: 'var(--primary)', fontSize: '2rem', fontWeight: '800', marginBottom: '0.1rem' }}>{settings.companyName}</h1>
                <p style={{ fontWeight: '600', fontSize: '1rem' }}>TRAVEL & CAB SERVICES</p>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={12} /> {settings.address}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={12} /> {settings.contact}</p>
                  {record.clientCompany && <p style={{ marginTop: '0.3rem', color: 'var(--text)' }}><strong>Client:</strong> {record.clientCompany} {record.deptName ? `(${record.deptName})` : ''}</p>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-block', padding: '0.4rem 0.8rem', background: 'var(--primary)', color: 'white', borderRadius: '4px', marginBottom: '0.5rem' }}>
                   <h3 style={{ margin: 0, fontSize: '1.1rem' }}>TAX INVOICE</h3>
                </div>
                <p style={{ fontSize: '0.85rem' }}><strong>Bill No:</strong> {record.billNumber}</p>
                <p style={{ fontSize: '0.85rem' }}><strong>Date:</strong> {record.date}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Internal Trip Summary Report</h2>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>Customer: {record.customerName}</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{settings.companyName} - Trip Records & Logistics</p>
          </div>
        )}

        {/* Customer & Vehicle Info Header */}
        <div style={{ borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Department Detail</p>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.3rem' }}>{record.deptName || 'N/A'}</h2>
              <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>Managed By: <span style={{ color: '#000' }}>{record.managedBy || 'N/A'}</span></p>
              <p style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.5rem', color: '#1e293b' }}>{record.clientCompany || 'N/A'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Reference info</p>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Bill No: {record.billNumber || `#${record.id}`}</h3>
              <p style={{ fontSize: '0.9rem' }}>Date: {record.date}</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: '600' }}>Contact Person: {record.customerName}</p>
            </div>
          </div>
        </div>

        {/* Trip Table */}
        <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
          <table className="compact-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '4px 2px', textAlign: 'left', border: '1px solid #cbd5e1' }}>Customer Name</th>
                <th style={{ padding: '4px 2px', textAlign: 'left', border: '1px solid #cbd5e1' }}>Place</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', border: '1px solid #cbd5e1' }}>Invoice no</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', border: '1px solid #cbd5e1' }}>KM Run</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', border: '1px solid #cbd5e1' }}>Rs</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', border: '1px solid #cbd5e1' }}>Total</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', border: '1px solid #cbd5e1' }}>DA</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', border: '1px solid #cbd5e1' }}>Parking</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', border: '1px solid #cbd5e1' }}>night</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', border: '1px solid #cbd5e1' }}>whole night</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', border: '1px solid #cbd5e1' }}>toll</th>
                <th style={{ padding: '4px 2px', textAlign: 'right', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {record.trips.map((trip, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 2px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: '600' }}>{trip.passengerName || record.customerName}</div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{trip.tripDate}</div>
                  </td>
                  <td style={{ padding: '5px 2px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: '500' }}>{trip.fromLoc} - {trip.toLoc}</div>
                  </td>
                  <td style={{ padding: '5px 2px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{idx + 1}</td>
                  <td style={{ padding: '5px 2px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                     {trip.billableKm}
                     <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>({trip.openingKm}-{trip.closingKm})</div>
                  </td>
                  <td style={{ padding: '5px 2px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{trip.rate}</td>
                  <td style={{ padding: '5px 2px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600' }}>{trip.baseFare}</td>
                  <td style={{ padding: '5px 2px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{trip.da || '-'}</td>
                  <td style={{ padding: '5px 2px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{trip.parking || '-'}</td>
                  <td style={{ padding: '5px 2px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{trip.nightCharges || '-'}</td>
                  <td style={{ padding: '5px 2px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{trip.wholeNightCharges || '-'}</td>
                  <td style={{ padding: '5px 2px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{trip.toll || '-'}</td>
                  <td style={{ padding: '5px 2px', textAlign: 'right', fontWeight: '700', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    ₹{trip.tripTotal.toLocaleString()}
                  </td>
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
