import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Mail, Phone, MapPin, Edit, FileText } from 'lucide-react';
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
    const filename = `${record.type === 'bill' ? 'Invoice' : 'Summary'}_${record.billNumber || record.id}.pdf`;
    const opt = {
      margin: [0.3, 0.4, 0.3, 0.4], // top, left, bottom, right in inches
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  if (!record || !settings) return <div style={{ padding: '2rem' }}>Loading report...</div>;

  const isBill = record.type === 'bill';
  const trips = record.trips || [];

  // Determine dynamic columns presence across all trips (REMOVE columns if all 0/blank)
  const hasPassenger = trips.some(t => t.passengerName && t.passengerName.trim() !== '');
  const hasVehicle = trips.some(t => t.vehicleNumber && t.vehicleNumber.trim() !== '');
  const hasCarType = trips.some(t => t.carType && t.carType.trim() !== '');
  const hasRoute = trips.some(t => (t.fromLoc && t.fromLoc.trim() !== '') || (t.toLoc && t.toLoc.trim() !== ''));
  const hasKm = trips.some(t => (Number(t.closingKm) || 0) > 0 || (Number(t.billableKm) || 0) > 0);
  const hasRate = trips.some(t => (Number(t.rate) || 0) > 0);
  const hasDA = trips.some(t => (Number(t.da) || 0) > 0);
  const hasNight = trips.some(t => (Number(t.nightCharges) || 0) > 0);
  const hasWholeNight = trips.some(t => (Number(t.wholeNightCharges) || 0) > 0);
  const hasToll = trips.some(t => (Number(t.toll) || 0) > 0);
  const hasParking = trips.some(t => (Number(t.parking) || 0) > 0);
  const hasExtra = trips.some(t => (Number(t.extraCharges) || 0) > 0);
  const hasRemarks = trips.some(t => t.remarks && t.remarks.trim() !== '');

  // Calculate totals
  const daTotal = trips.reduce((acc, t) => acc + (Number(t.da) || 0), 0);
  const nightTotal = trips.reduce((acc, t) => acc + (Number(t.nightCharges) || 0), 0);
  const wholeNightTotal = trips.reduce((acc, t) => acc + (Number(t.wholeNightCharges) || 0), 0);
  const tollTotal = trips.reduce((acc, t) => acc + (Number(t.toll) || 0), 0);
  const parkingTotal = trips.reduce((acc, t) => acc + (Number(t.parking) || 0), 0);
  const extraTotal = trips.reduce((acc, t) => acc + (Number(t.extraCharges) || 0), 0);

  // Check which customer metadata fields are filled
  const hasClient = record.clientCompany && record.clientCompany.trim() !== '';
  const hasDept = record.deptName && record.deptName.trim() !== '';
  const hasManagedBy = record.managedBy && record.managedBy.trim() !== '';
  const hasCustomer = record.customerName && record.customerName.trim() !== '';
  const hasNotes = record.notes && record.notes.trim() !== '';

  return (
    <div className="animate-fade">
      {/* Control Action Buttons (Hidden when printing) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(`/edit/${id}`)} className="btn btn-secondary" style={{ backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }}>
            <Edit size={18} /> Edit Bill Details
          </button>
          <button onClick={handleDownload} className="btn btn-secondary" style={{ backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}>
            <Download size={18} /> Download PDF
          </button>
          <button onClick={() => window.print()} className="btn btn-primary">
            <Printer size={18} /> Print Invoice
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div id="printable-area" className="card" style={{ padding: '2rem 2.5rem', maxWidth: '950px', margin: '0 auto', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid #1e293b', paddingBottom: '1.2rem', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ color: 'var(--primary-dark)', fontSize: '2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                {settings.companyName || 'PARVATI TRADING CO.'}
              </h1>
              <p style={{ fontWeight: '700', fontSize: '0.95rem', color: '#475569', marginTop: '2px', letterSpacing: '0.5px' }}>
                TRAVEL & CAB SERVICES
              </p>
              <div style={{ marginTop: '0.5rem', color: '#334155', fontSize: '0.85rem', lineHeight: '1.4' }}>
                {settings.address && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '2px 0' }}>
                    <MapPin size={13} color="var(--primary)" /> {settings.address}
                  </p>
                )}
                {settings.contact && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '2px 0' }}>
                    <Phone size={13} color="var(--primary)" /> {settings.contact}
                  </p>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: '#1e293b', color: '#ffffff', borderRadius: '4px', marginBottom: '0.6rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', letterSpacing: '1px' }}>
                  {isBill ? 'TAX INVOICE' : 'TRIP SUMMARY'}
                </h3>
              </div>
              <p style={{ fontSize: '0.95rem', margin: '3px 0' }}>
                <strong>Invoice No:</strong> <span style={{ color: 'var(--primary-dark)', fontWeight: '700' }}>{record.billNumber || `#${record.id}`}</span>
              </p>
              <p style={{ fontSize: '0.9rem', margin: '3px 0', color: '#475569' }}>
                <strong>Date:</strong> {record.date}
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Department Details (ONLY render filled items, hide empty ones completely) */}
        {(hasClient || hasDept || hasManagedBy || hasCustomer) && (
          <div style={{ background: '#f8fafc', padding: '0.8rem 1.2rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '1.2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', fontSize: '0.88rem' }}>
              {hasClient && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Client Company</span>
                  <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>{record.clientCompany}</strong>
                </div>
              )}
              {hasCustomer && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Contact / Passenger</span>
                  <strong style={{ color: '#0f172a' }}>{record.customerName}</strong>
                </div>
              )}
              {hasDept && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Department</span>
                  <strong style={{ color: '#0f172a' }}>{record.deptName}</strong>
                </div>
              )}
              {hasManagedBy && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Managed By</span>
                  <strong style={{ color: '#0f172a' }}>{record.managedBy}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Trip Table (Columns hide automatically if 0/empty across all trips) */}
        <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#0f172a' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderTop: '2px solid #334155', borderBottom: '2px solid #334155' }}>
                <th style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #cbd5e1', width: '35px' }}>#</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', border: '1px solid #cbd5e1' }}>Date</th>
                {(hasPassenger || hasVehicle || hasCarType) && (
                  <th style={{ padding: '8px 6px', textAlign: 'left', border: '1px solid #cbd5e1' }}>Vehicle & Passenger</th>
                )}
                {hasRoute && (
                  <th style={{ padding: '8px 6px', textAlign: 'left', border: '1px solid #cbd5e1' }}>Route (From - To)</th>
                )}
                {hasKm && (
                  <th style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #cbd5e1' }}>KM Run</th>
                )}
                {hasRate && (
                  <th style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #cbd5e1' }}>Rate/KM</th>
                )}
                <th style={{ padding: '8px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Base Fare</th>
                {hasDA && (
                  <th style={{ padding: '8px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>DA</th>
                )}
                {hasNight && (
                  <th style={{ padding: '8px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Night</th>
                )}
                {hasWholeNight && (
                  <th style={{ padding: '8px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Whole Night</th>
                )}
                {hasToll && (
                  <th style={{ padding: '8px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Toll</th>
                )}
                {hasParking && (
                  <th style={{ padding: '8px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Parking</th>
                )}
                {hasExtra && (
                  <th style={{ padding: '8px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Extra</th>
                )}
                {hasRemarks && (
                  <th style={{ padding: '8px 6px', textAlign: 'left', border: '1px solid #cbd5e1' }}>Remarks</th>
                )}
                <th style={{ padding: '8px 6px', textAlign: 'right', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0', fontWeight: '700' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {trips.length > 0 ? trips.map((trip, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '7px 6px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: '600' }}>{idx + 1}</td>
                  <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', whitespace: 'nowrap' }}>{trip.tripDate}</td>
                  {(hasPassenger || hasVehicle || hasCarType) && (
                    <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1' }}>
                      {trip.vehicleNumber && <div style={{ fontWeight: '700' }}>{trip.vehicleNumber}</div>}
                      {trip.carType && <div style={{ fontSize: '0.75rem', color: '#475569' }}>{trip.carType} {trip.tripType ? `(${trip.tripType})` : ''}</div>}
                      {trip.passengerName && <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#334155' }}>Pass: {trip.passengerName}</div>}
                    </td>
                  )}
                  {hasRoute && (
                    <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1' }}>
                      {(trip.fromLoc || trip.toLoc) ? `${trip.fromLoc || ''} ${trip.toLoc ? `→ ${trip.toLoc}` : ''}` : '-'}
                    </td>
                  )}
                  {hasKm && (
                    <td style={{ padding: '7px 6px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontWeight: '600' }}>{trip.billableKm || 0} km</div>
                      {(Number(trip.openingKm) > 0 || Number(trip.closingKm) > 0) && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>({trip.openingKm || 0}-{trip.closingKm || 0})</div>
                      )}
                    </td>
                  )}
                  {hasRate && (
                    <td style={{ padding: '7px 6px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                      {Number(trip.rate) > 0 ? `₹${trip.rate}` : '-'}
                    </td>
                  )}
                  <td style={{ padding: '7px 6px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: '600' }}>
                    ₹{(trip.baseFare || 0).toLocaleString()}
                  </td>
                  {hasDA && (
                    <td style={{ padding: '7px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>
                      {Number(trip.da) > 0 ? `₹${trip.da}` : '-'}
                    </td>
                  )}
                  {hasNight && (
                    <td style={{ padding: '7px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>
                      {Number(trip.nightCharges) > 0 ? `₹${trip.nightCharges}` : '-'}
                    </td>
                  )}
                  {hasWholeNight && (
                    <td style={{ padding: '7px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>
                      {Number(trip.wholeNightCharges) > 0 ? `₹${trip.wholeNightCharges}` : '-'}
                    </td>
                  )}
                  {hasToll && (
                    <td style={{ padding: '7px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>
                      {Number(trip.toll) > 0 ? `₹${trip.toll}` : '-'}
                    </td>
                  )}
                  {hasParking && (
                    <td style={{ padding: '7px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>
                      {Number(trip.parking) > 0 ? `₹${trip.parking}` : '-'}
                    </td>
                  )}
                  {hasExtra && (
                    <td style={{ padding: '7px 6px', textAlign: 'right', border: '1px solid #cbd5e1' }}>
                      {Number(trip.extraCharges) > 0 ? `₹${trip.extraCharges}` : '-'}
                    </td>
                  )}
                  {hasRemarks && (
                    <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}>
                      {trip.remarks || '-'}
                    </td>
                  )}
                  <td style={{ padding: '7px 6px', textAlign: 'right', fontWeight: '700', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}>
                    ₹{(trip.tripTotal || 0).toLocaleString()}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="15" style={{ textAlign: 'center', padding: '1rem' }}>No trip logs recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Breakdown & Totals Box */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ width: '320px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', fontWeight: '700', fontSize: '0.85rem', borderBottom: '1px solid #cbd5e1' }}>
              BILL SUMMARY
            </div>

            <div style={{ padding: '0.5rem 0.8rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span>Base Subtotal</span>
                <span style={{ fontWeight: '600' }}>₹{(record.subtotal || 0).toLocaleString()}</span>
              </div>

              {daTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                  <span>Total DA Charges</span>
                  <span>+ ₹{daTotal.toLocaleString()}</span>
                </div>
              )}

              {(nightTotal > 0 || wholeNightTotal > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                  <span>Night Halt Charges</span>
                  <span>+ ₹{(nightTotal + wholeNightTotal).toLocaleString()}</span>
                </div>
              )}

              {(tollTotal > 0 || parkingTotal > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                  <span>Toll & Parking</span>
                  <span>+ ₹{(tollTotal + parkingTotal).toLocaleString()}</span>
                </div>
              )}

              {extraTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                  <span>Extra Trip Charges</span>
                  <span>+ ₹{extraTotal.toLocaleString()}</span>
                </div>
              )}

              {Number(record.discount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}>
                  <span>Discount</span>
                  <span>- ₹{Number(record.discount).toLocaleString()}</span>
                </div>
              )}

              {Number(record.taxAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #f1f5f9', color: '#2563eb' }}>
                  <span>GST / Tax ({record.taxRate}%)</span>
                  <span>+ ₹{Number(record.taxAmount).toLocaleString()}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0 0.4rem 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-dark)', borderTop: '2px solid #0f172a' }}>
                <span>Grand Total</span>
                <span>₹{(record.grandTotal || 0).toLocaleString()}</span>
              </div>

              {Number(record.advancePaid) > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#166534' }}>
                    <span>Less: Advance Paid</span>
                    <span>- ₹{Number(record.advancePaid).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0 0.2rem 0', fontSize: '1.1rem', fontWeight: '800', color: '#b45309', borderTop: '1px dashed #cbd5e1' }}>
                    <span>Balance Due</span>
                    <span>₹{(record.balanceDue || 0).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Remarks / Notes (Only show if filled) */}
        {hasNotes && (
          <div style={{ marginBottom: '2rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', background: '#f8fafc', padding: '0.8rem 1rem', borderRadius: '6px' }}>
            <strong style={{ display: 'block', color: '#334155', marginBottom: '0.3rem' }}>Remarks / Special Instructions:</strong>
            <p style={{ margin: 0, color: '#0f172a', fontStyle: 'italic' }}>{record.notes}</p>
          </div>
        )}

        {/* Footer & Authorized Signatory */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '60%' }}>
              {settings.footerNote && <p style={{ margin: '0 0 4px 0' }}><strong>Note:</strong> {settings.footerNote}</p>}
              <p style={{ margin: 0 }}>This is a computer-generated invoice document.</p>
            </div>
            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{ height: '40px' }}></div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '0.3rem', fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                {settings.signatureText || 'Authorized Signatory'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Preview;
