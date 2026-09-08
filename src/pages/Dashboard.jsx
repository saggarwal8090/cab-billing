import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, ClipboardList, Search, ArrowRight } from 'lucide-react';
import { api as axios } from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ bills: 0, summaries: 0 });
  const [recent, setRecent] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/records');
      const data = res.data;
      setStats({
        bills: data.filter(r => r.type === 'bill').length,
        summaries: data.filter(r => r.type === 'summary').length
      });
      setRecent(data.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredHistory = recent.filter(r => 
    (r.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (r.clientCompany?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Welcome, Parvati Trading</h1>
          <p style={{ color: 'var(--text-light)' }}>Manage your cab trips and billing efficiently.</p>
        </div>
        <Link to="/new" className="btn btn-primary">
          <Plus size={18} /> New Entry
        </Link>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--primary)' }}>
            <FileText size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: '500' }}>Total Bills</p>
            <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.bills}</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--warning)' }}>
            <ClipboardList size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: '500' }}>Total Summaries</p>
            <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.summaries}</h2>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '600' }}>Recent Records</h3>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input 
              type="text" 
              placeholder="Search customer or vehicle..." 
              style={{ paddingLeft: '2.2rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Grand Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? filteredHistory.map(record => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>
                    <span className={`badge badge-${record.type}`}>
                      {record.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: '500' }}>{record.customerName}</td>
                  <td>{record.clientCompany || 'N/A'}</td>
                  <td style={{ fontWeight: '600' }}>₹{record.grandTotal.toLocaleString()}</td>
                  <td>
                    <Link to={`/preview/${record.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.85rem', fontWeight: '500' }}>
                      View <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    No recent records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {recent.length > 0 && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link to="/history" style={{ color: 'var(--text-light)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
              View All History
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
