import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, Settings as SettingsIcon, Car } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import EntryForm from './pages/EntryForm';
import HistoryPage from './pages/History';
import Settings from './pages/Settings';
import Preview from './pages/Preview';

const NavLink = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={isActive ? 'active' : ''}>
      <Icon size={18} />
      {children}
    </Link>
  );
};

function App() {
  return (
    <Router>
      <header className="no-print">
        <div className="container nav-content">
          <Link to="/" className="logo">
            <Car size={24} fill="currentColor" />
            Parvati Trading Co.
          </Link>
          <nav className="nav-links">
            <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
            <NavLink to="/new" icon={PlusCircle}>New Entry</NavLink>
            <NavLink to="/history" icon={History}>History</NavLink>
            <NavLink to="/settings" icon={SettingsIcon}>Settings</NavLink>
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<EntryForm />} />
          <Route path="/edit/:id" element={<EntryForm />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/preview/:id" element={<Preview />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
