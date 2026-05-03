import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';

const SalesHistory = () => {
  const [sales, setSales]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSales(); }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await API.get('/sales/');
      setSales(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const totalUnits   = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <div className="page-inner">

          <div className="page-header">
            <h1>Sales History</h1>
            <p>Complete log of all recorded medicine sales and revenue.</p>
          </div>

          {/* Summary KPIs */}
          <div className="kpi-grid" style={{ marginBottom: 28 }}>
            <div className="kpi-card emerald">
              <div className="kpi-icon emerald">💰</div>
              <div className="kpi-label">Total Revenue</div>
              <div className="kpi-value">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="kpi-card cyan">
              <div className="kpi-icon cyan">🛒</div>
              <div className="kpi-label">Total Transactions</div>
              <div className="kpi-value">{sales.length}</div>
            </div>
            <div className="kpi-card indigo">
              <div className="kpi-icon indigo">📦</div>
              <div className="kpi-label">Units Sold</div>
              <div className="kpi-value">{totalUnits.toLocaleString()}</div>
            </div>
            <div className="kpi-card amber">
              <div className="kpi-icon amber">📊</div>
              <div className="kpi-label">Avg Sale Value</div>
              <div className="kpi-value">
                ₹{sales.length ? (totalRevenue / sales.length).toFixed(1) : '0'}
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="glass-card card-pad">
            <div className="section-title" style={{ marginBottom: 16 }}>
              <span className="dot dot-emerald" /> Transaction Log
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                {sales.length} records
              </span>
            </div>

            {loading ? (
              <div className="loader"><div className="spinner" />Loading sales…</div>
            ) : sales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛒</div>
                No sales recorded yet. Go to Record Sale to add your first transaction.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="intel-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine</th>
                      <th>Quantity</th>
                      <th>Total Price</th>
                      <th>Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s, i) => (
                      <tr key={s.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{s.medicine_name}</td>
                        <td>
                          <span className="badge badge-info">{s.quantity} units</span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>
                          ₹{Number(s.total_price).toFixed(2)}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {new Date(s.date).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SalesHistory;