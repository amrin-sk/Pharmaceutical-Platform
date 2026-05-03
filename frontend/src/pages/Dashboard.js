import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';

const API_BASE = 'http://127.0.0.1:8000/api/ml';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem'
      }}>
        <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontWeight: 700 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [stats, setStats]           = useState(null);
  const [chartData, setChartData]   = useState([]);
  const [medicines, setMedicines]   = useState([]);
  const [selectedMed, setSelectedMed] = useState('');
  const [mlResult, setMlResult]     = useState(null);
  const [mlLoading, setMlLoading]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchChart();
    fetchMedicines();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/`);
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
  };

  const fetchChart = async () => {
    try {
      const res = await fetch(`${API_BASE}/sales-trend/`);
      const data = await res.json();
      // Show last 30 data points
      setChartData(data.slice(-30));
    } catch (e) { console.error(e); }
  };

  const fetchMedicines = async () => {
    try {
      const res = await fetch(`${API_BASE}/medicines/`);
      const data = await res.json();
      setMedicines(data);
    } catch (e) { console.error(e); }
  };

  const runML = async () => {
    if (!selectedMed) return alert('Please select a medicine');
    setMlLoading(true);
    setMlResult(null);
    try {
      const res = await fetch(`${API_BASE}/run-ml/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicine: selectedMed })
      });
      const data = await res.json();
      setMlResult(data);
    } catch (e) { console.error(e); }
    setMlLoading(false);
  };

  const KPI_CARDS = [
    {
      label: 'Total Medicines',
      value: stats?.total_medicines ?? '—',
      icon: '💊', accent: 'cyan',
      sub: 'Units in stock'
    },
    {
      label: 'Today\'s Sales',
      value: stats?.today_sales ?? '—',
      icon: '🛒', accent: 'indigo',
      sub: 'Transactions today'
    },
    {
      label: 'Total Revenue',
      value: stats?.total_revenue
        ? `₹${Number(stats.total_revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
        : '—',
      icon: '💰', accent: 'emerald',
      sub: 'All-time revenue'
    },
    {
      label: 'Expiring Soon',
      value: stats?.expiring_soon ?? '—',
      icon: '⏳', accent: 'amber',
      sub: 'Within 30 days'
    },
  ];

  const decisionStyle = {
    'High Risk — Expiring Soon': { color: 'var(--rose)', bg: 'rgba(244,63,94,0.1)' },
    'Reorder Recommended':       { color: 'var(--amber)', bg: 'rgba(245,158,11,0.1)' },
    'Stock Healthy':             { color: 'var(--emerald)', bg: 'rgba(16,185,129,0.1)' },
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <div className="page-inner">

          {/* ── Header ── */}
          <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1>Dashboard</h1>
              <p>Welcome back! Here's your store intelligence overview.</p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/intel')}>
              🧠 Open Intel Hub
            </button>
          </div>

          {/* ── Alerts ── */}
          {stats && stats.expiring_soon > 0 && (
            <div className="alert-banner alert-danger animate-fade-up">
              🚨 <strong>{stats.expiring_soon}</strong> medicines expiring within 30 days.
              <span
                onClick={() => navigate('/intel')}
                style={{ marginLeft: 12, cursor: 'pointer', textDecoration: 'underline', opacity: 0.8 }}
              >
                View Risk Analysis →
              </span>
            </div>
          )}

          {/* ── KPI Cards ── */}
          <div className="kpi-grid stagger">
            {KPI_CARDS.map((card, i) => (
              <div key={i} className={`kpi-card ${card.accent} animate-fade-up`}>
                <div className={`kpi-icon ${card.accent}`}>{card.icon}</div>
                <div className="kpi-label">{card.label}</div>
                <div className="kpi-value">{card.value}</div>
                <div className="kpi-sub">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Bottom Grid: Chart + Quick AI ── */}
          <div className="grid-2" style={{ marginTop: 8 }}>

            {/* Sales Trend Chart */}
            <div className="glass-card card-pad animate-fade-up">
              <div className="section-title" style={{ marginBottom: 20 }}>
                <span className="dot dot-cyan" />
                Sales Trend (Last 30 Days)
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone" dataKey="sales" name="Sales"
                      stroke="#06b6d4" strokeWidth={2}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="loader" style={{ height: 260 }}>
                  <div className="spinner" />
                </div>
              )}
            </div>

            {/* Quick AI Prediction Panel */}
            <div className="glass-card card-pad animate-fade-up">
              <div className="section-title" style={{ marginBottom: 20 }}>
                <span className="dot dot-indigo" />
                Quick AI Prediction
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 18 }}>
                Select a medicine and run a quick stock & expiry analysis.
              </p>

              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                <select
                  className="form-select"
                  style={{ flex: 1 }}
                  value={selectedMed}
                  onChange={e => setSelectedMed(e.target.value)}
                >
                  <option value="">Choose medicine…</option>
                  {medicines.map((m, i) => (
                    <option key={i} value={m}>{m}</option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={runML}
                  disabled={mlLoading || !selectedMed}
                >
                  {mlLoading
                    ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    : '🤖 Analyze'
                  }
                </button>
              </div>

              {mlResult && (
                <div className="animate-fade-up" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: 18
                }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Decision</div>
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      borderRadius: 30,
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      ...(decisionStyle[mlResult.decision] || { color: 'var(--cyan)', background: 'rgba(6,182,212,0.1)' })
                    }}>
                      {mlResult.decision}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Medicine', value: mlResult.medicine },
                      { label: 'Daily Sales', value: mlResult.sales },
                      { label: 'Current Stock', value: mlResult.stock },
                      { label: 'Expiry Days Left', value: `${mlResult.expiry}d` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 8, padding: '10px 14px'
                      }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!mlResult && !mlLoading && (
                <div style={{
                  textAlign: 'center', padding: '30px 20px',
                  background: 'rgba(255,255,255,0.02)', borderRadius: 12,
                  border: '1px dashed rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 10 }}>🤖</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Select a medicine above and click Analyze to get AI-powered insights.
                  </div>
                </div>
              )}

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button className="btn btn-ghost w-full" onClick={() => navigate('/intel')}
                  style={{ justifyContent: 'center' }}>
                  View Full Intelligence Hub →
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;