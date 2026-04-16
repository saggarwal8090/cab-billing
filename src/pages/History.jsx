import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Printer, Trash2, Eye, Calendar, User, Car, Edit } from 'lucide-react';
import { api as axios } from '../utils/api';

const History = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await axios.get('/api/records');
      setRecords(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record forever?')) return;
    try {
      await axios.delete(`/api/records/${id}`);
      setRecords(records.filter(r => r.id !== id));
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const filtered = records.filter(r => {
    const matchesSearch = 
      (r.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (r.clientCompany?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.billNumber && r.billNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || r.type === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) return <div style={{ padding: '2rem' }}>Loading trip history...</div>;

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Trip & Bill History</h1>
        <p style={{ color: 'var(--text-light)' }}>View, search, and manage all your past entries.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input 
              type="text" 
              placeholder="Search by Bill #, Customer, or Vehicle..." 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            style={{ width: 'auto', minWidth: '150px' }} 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="bill">Bills Only</option>
            <option value="summary">Summaries Only</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Record #</th>
                <th>Type</th>
                <th>Customer Name</th>
                <th>Vehicle Details</th>
                <th>Grand Total</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(record => (
                <tr key={record.id} hover="true">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} color="var(--text-light)" />
                      {record.date}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: record.billNumber ? 'var(--primary)' : 'inherit' }}>
                      {record.billNumber || `#${record.id}`}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${record.type}`}>
                      {record.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <User size={14} color="var(--text-light)" />
                      {record.customerName}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Car size={14} color="var(--text-light)" />
                      <span style={{ fontSize: '0.8rem' }}>{record.clientCompany || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: '700' }}>₹{record.grandTotal.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <Link to={`/preview/${record.id}`} title="View/Print" style={{ color: 'var(--primary)' }}>
                        <Eye size={18} />
                      </Link>
                      <Link to={`/edit/${record.id}`} title="Edit" style={{ color: 'var(--secondary)' }}>
                        <Edit size={18} />
                      </Link>
                      <button onClick={() => deleteRecord(record.id)} title="Delete" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
