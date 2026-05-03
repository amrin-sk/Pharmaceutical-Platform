import React, { useEffect, useState, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import {
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, BarChart, Bar, Cell, Legend
} from 'recharts';

const API = 'http://127.0.0.1:8000/api/ml';

// ── Custom Recharts Tooltip ──
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload;
    const stock = d.current_stock;
    const demand = d.out_of_stock ? d.unmet_7d_demand : d.predicted_7d_demand;
    const gap = demand - stock;

    return (
      <div style={{
        background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '12px 16px', fontSize: '0.85rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', minWidth: 200
      }}>
        <p style={{ color: '#fff', fontWeight: 800, marginBottom: 8, fontSize: '1rem' }}>{label}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>📦 Current Stock:</span>
            <span style={{ fontWeight: 700, color: stock === 0 ? '#f43f5e' : '#10b981' }}>{stock}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>📈 7-Day Demand:</span>
            <span style={{ fontWeight: 700, color: '#6366f1' }}>{demand.toFixed(1)}</span>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

          {gap > 0 ? (
            <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>
              ⚠ Shortfall of {gap.toFixed(1)} units predicted
            </div>
          ) : (
            <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
              ✅ Stock matches/exceeds demand
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// ── Risk Badge ──
const RiskBadge = ({ level }) => {
  const cls = level === 'High' ? 'badge-high' : level === 'Medium' ? 'badge-medium' : 'badge-low';
  const dot = level === 'High' ? '🔴' : level === 'Medium' ? '🟡' : '🟢';
  return <span className={`badge ${cls}`}>{dot} {level}</span>;
};

// ── Action Badge ──
const ActionBadge = ({ type }) => {
  const map = {
    danger:  { cls: 'badge-high',   label: '🚨 Critical' },
    warning: { cls: 'badge-medium', label: '⚠ Reorder' },
    success: { cls: 'badge-low',    label: '✓ Healthy' },
    info:    { cls: 'badge-info',   label: 'ℹ Monitor' },
  };
  const { cls, label } = map[type] || map.info;
  return <span className={`badge ${cls}`}>{label}</span>;
};

const SNA_COLORS = ['#06b6d4', '#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'];

// ── Simple Canvas SNA graph (no external dep needed for display) ──
const SNAGraph = ({ data }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);
  const isDragging = useRef(false);
  const dragNode = useRef(null);

  useEffect(() => {
    if (!data || !data.nodes || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    // Limit display to top 40 nodes by val
    const topNodes = [...data.nodes].sort((a, b) => b.val - a.val).slice(0, 40);
    const nodeIdSet = new Set(topNodes.map(n => n.id));
    const displayEdges = data.edges.filter(
      e => nodeIdSet.has(e.source) && nodeIdSet.has(e.target)
    ).slice(0, 80);

    // Assign random initial positions
    const cats = [...new Set(topNodes.map(n => n.category))];
    const catColorMap = {};
    cats.forEach((c, i) => { catColorMap[c] = SNA_COLORS[i % SNA_COLORS.length]; });

    nodesRef.current = topNodes.map((n, i) => ({
      ...n,
      x: W / 2 + (Math.random() - 0.5) * W * 0.7,
      y: H / 2 + (Math.random() - 0.5) * H * 0.7,
      vx: 0, vy: 0,
      color: catColorMap[n.category] || '#06b6d4',
      r: Math.max(5, Math.min(16, n.val * 1.5))
    }));

    const nodeById = {};
    nodesRef.current.forEach(n => { nodeById[n.id] = n; });

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Draw edges
      displayEdges.forEach(e => {
        const src = nodeById[e.source];
        const tgt = nodeById[e.target];
        if (!src || !tgt) return;
        ctx.save();
        ctx.globalAlpha = 0.25 + e.weight * 0.5;
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1 + e.weight * 2;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.stroke();
        ctx.restore();
      });

      // Draw nodes
      nodesRef.current.forEach(n => {
        // Glow
        ctx.save();
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();

        // Label for big nodes
        if (n.r >= 10) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#f0f6ff';
          ctx.font = `bold ${Math.min(11, n.r)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(n.name.slice(0, 12), n.x, n.y + n.r + 13);
        }
      });
    };

    // Simple spring layout simulation
    let tick = 0;
    const simulate = () => {
      tick++;
      const cooling = Math.max(0.1, 1 - tick / 300);

      // Repulsion
      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const a = nodesRef.current[i], b = nodesRef.current[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (800 / (dist * dist)) * cooling;
          a.vx -= force * dx / dist; a.vy -= force * dy / dist;
          b.vx += force * dx / dist; b.vy += force * dy / dist;
        }
      }

      // Attraction along edges
      displayEdges.forEach(e => {
        const src = nodeById[e.source], tgt = nodeById[e.target];
        if (!src || !tgt) return;
        const dx = tgt.x - src.x, dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 100) * 0.05 * e.weight;
        src.vx += force * dx / dist; src.vy += force * dy / dist;
        tgt.vx -= force * dx / dist; tgt.vy -= force * dy / dist;
      });

      // Center gravity
      nodesRef.current.forEach(n => {
        n.vx += (W / 2 - n.x) * 0.002;
        n.vy += (H / 2 - n.y) * 0.002;
        n.vx *= 0.85; n.vy *= 0.85;
        if (n !== dragNode.current) {
          n.x += n.vx; n.y += n.vy;
        }
        // Bounds
        n.x = Math.max(n.r, Math.min(W - n.r, n.x));
        n.y = Math.max(n.r, Math.min(H - n.r, n.y));
      });

      draw();
      animRef.current = requestAnimationFrame(simulate);
    };

    animRef.current = requestAnimationFrame(simulate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', cursor: 'grab', borderRadius: 14 }}
    />
  );
};


// ════════════════════════════════════
// MAIN — Intelligence Hub Page
// ════════════════════════════════════
const IntelHub = () => {
  const [activeTab, setActiveTab] = useState('network');
  const [snaData, setSnaData]         = useState(null);
  const [demandData, setDemandData]   = useState([]);
  const [riskData, setRiskData]       = useState([]);
  const [recData, setRecData]         = useState([]);
  const [recSummary, setRecSummary]   = useState(null);
  const [loading, setLoading]         = useState({});
  const [retraining, setRetraining]   = useState(false);
  const [trainResult, setTrainResult] = useState(null);

  const setLoad = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

  const fetchSNA = useCallback(async () => {
    setLoad('network', true);
    try {
      const res = await fetch(`${API}/sna-graph/`);
      const data = await res.json();
      setSnaData(data);
    } catch (e) { console.error(e); }
    setLoad('network', false);
  }, []);

  const fetchDemand = useCallback(async () => {
    setLoad('demand', true);
    try {
      const res = await fetch(`${API}/demand-forecast/`);
      const data = await res.json();
      setDemandData(data.results?.slice(0, 20) || []);
    } catch (e) { console.error(e); }
    setLoad('demand', false);
  }, []);

  const fetchRisk = useCallback(async () => {
    setLoad('risk', true);
    try {
      const res = await fetch(`${API}/expiry-risks/`);
      const data = await res.json();
      setRiskData(data.results?.slice(0, 30) || []);
    } catch (e) { console.error(e); }
    setLoad('risk', false);
  }, []);

  const fetchRecs = useCallback(async () => {
    setLoad('recs', true);
    try {
      const res = await fetch(`${API}/recommendations/`);
      const data = await res.json();
      setRecData(data.recommendations || []);
      setRecSummary(data.summary || null);
    } catch (e) { console.error(e); }
    setLoad('recs', false);
  }, []);

  useEffect(() => {
    fetchSNA();
    fetchDemand();
    fetchRisk();
    fetchRecs();
  }, [fetchSNA, fetchDemand, fetchRisk, fetchRecs]);

  const handleRetrain = async () => {
    setRetraining(true);
    setTrainResult(null);
    try {
      const res = await fetch(`${API}/retrain/`, { method: 'POST' });
      const data = await res.json();
      setTrainResult(data);
      // Refresh all data after retraining
      fetchDemand(); fetchRisk(); fetchRecs();
    } catch (e) { console.error(e); }
    setRetraining(false);
  };

  const TABS = [
    { id: 'network', label: '🕸 Network Graph' },
    { id: 'demand',  label: '📈 Demand Forecast' },
    { id: 'risk',    label: '⚠ Expiry Risk' },
    { id: 'recs',    label: '🎯 Recommendations' },
  ];

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <div className="page-inner">

          {/* ── Header ── */}
          <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1>Intelligence Hub</h1>
              <p>AI-powered insights: SNA co-purchase graph · XGBoost demand · Random Forest risk · Recommendations</p>
            </div>
            <button
              className={`btn ${retraining ? 'btn-ghost' : 'btn-success'}`}
              onClick={handleRetrain}
              disabled={retraining}
            >
              {retraining ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Training…</>
              ) : '🔄 Retrain Models'}
            </button>
          </div>

          {/* Train result banner */}
          {trainResult && (
            <div className="alert-banner alert-info animate-fade-up" style={{ marginBottom: 20 }}>
              ✅ Models retrained — Demand Accuracy: <strong>{(trainResult.demand_model_accuracy * 100).toFixed(1)}%</strong> · Risk Accuracy: <strong>{(trainResult.risk_model_accuracy * 100).toFixed(1)}%</strong>
            </div>
          )}

          {/* ── Summary KPIs (from Recommendations) ── */}
          {recSummary && (
            <div className="kpi-grid stagger animate-fade-up" style={{ marginBottom: 28 }}>
              <div className="kpi-card cyan">
                <div className="kpi-icon cyan">💊</div>
                <div className="kpi-label">Total Medicines</div>
                <div className="kpi-value">{recSummary.total_medicines}</div>
              </div>
              <div className="kpi-card rose">
                <div className="kpi-icon rose">🚨</div>
                <div className="kpi-label">Critical Alerts</div>
                <div className="kpi-value">{recSummary.critical_alerts}</div>
              </div>
              <div className="kpi-card amber">
                <div className="kpi-icon amber">📦</div>
                <div className="kpi-label">Reorder Needed</div>
                <div className="kpi-value">{recSummary.reorder_needed}</div>
              </div>
              <div className="kpi-card emerald">
                <div className="kpi-icon emerald">✅</div>
                <div className="kpi-label">Health Score</div>
                <div className="kpi-value">{recSummary.health_score}%</div>
                <div className="kpi-sub">{recSummary.healthy_stock} healthy medicines</div>
              </div>
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="tab-bar">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >{t.label}</button>
            ))}
          </div>

          {/* ══════════════════════════════════════
              TAB: Network Graph (SNA)
          ══════════════════════════════════════ */}
          {activeTab === 'network' && (
            <div className="animate-fade-in">
              <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
                <div className="section-header">
                  <div className="section-title">
                    <span className="dot dot-indigo" />
                    Medicine Co-Purchase Network
                  </div>
                  {snaData && (
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {snaData.stats?.total_nodes} nodes · {snaData.stats?.total_edges} edges
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                  Medicines connected by edges are frequently purchased on the same day.
                  Edge thickness = co-purchase strength · Node size = centrality.
                </p>
                <div className="graph-container">
                  {loading.network ? (
                    <div className="loader">
                      <div className="spinner" />
                      Building co-purchase graph…
                    </div>
                  ) : snaData ? (
                    <SNAGraph data={snaData} />
                  ) : (
                    <div className="loader">No graph data available.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB: Demand Forecast
          ══════════════════════════════════════ */}
          {activeTab === 'demand' && (
            <div className="animate-fade-in">
              {loading.demand ? (
                <div className="loader"><div className="spinner" />Running XGBoost demand forecast…</div>
              ) : (
                <>
                  {/* Bar chart — Stock vs Predicted demand */}
                  <div className="glass-card card-pad" style={{ marginBottom: 24 }}>
                    <div className="section-title" style={{ marginBottom: 8 }}>
                      <span className="dot dot-cyan" />Inventory vs. Predicted 7-Day Demand
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                      AI predictions calibrated by your store's real sales history. 
                      Compare current stock levels against personalized demand to identify shortfalls.
                    </p>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={demandData.slice(0, 10)} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                          dataKey="medicine" tick={{ fill: '#94a3b8', fontSize: 11 }}
                          angle={-35} textAnchor="end" interval={0}
                        />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.8rem', paddingBottom: 20 }} />
                        
                        {/* Current Stock Bar */}
                        <Bar dataKey="current_stock" name="📦 Current Stock" radius={[4, 4, 0, 0]} barSize={20}>
                          {demandData.slice(0, 10).map((d, i) => (
                            <Cell key={`stock-${i}`} fill={d.current_stock < 20 ? 'var(--rose)' : 'var(--emerald)'} />
                          ))}
                        </Bar>

                        {/* Predicted Demand Bar */}
                        <Bar 
                          dataKey={d => d.out_of_stock ? d.unmet_7d_demand : d.predicted_7d_demand} 
                          name="📈 7-Day Predicted Demand" 
                          radius={[4, 4, 0, 0]} 
                          barSize={20}
                        >
                          {demandData.slice(0, 10).map((_, i) => (
                            <Cell key={`demand-${i}`} fill="var(--indigo)" opacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <div className="glass-card card-pad">
                    <div className="section-title" style={{ marginBottom: 16 }}>
                      <span className="dot dot-indigo" />Full Demand Forecast Table
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="intel-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Medicine</th>
                            <th>Category</th>
                            <th>Current Stock</th>
                            <th>Daily Predicted</th>
                            <th>7-Day Forecast</th>
                            <th>Unmet Demand</th>
                            <th>Coverage (days)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {demandData.map((d, i) => (
                            <tr key={i} style={d.out_of_stock ? { background: 'rgba(244,63,94,0.06)', borderLeft: '3px solid var(--rose)' } : {}}>
                              <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                              <td style={{ fontWeight: 600 }}>
                                {d.medicine}
                                {d.out_of_stock && (
                                  <span style={{
                                    marginLeft: 8, fontSize: '0.62rem', padding: '2px 6px',
                                    background: 'rgba(244,63,94,0.2)', color: 'var(--rose)',
                                    borderRadius: 6, fontWeight: 700, verticalAlign: 'middle'
                                  }}>OUT OF STOCK</span>
                                )}
                              </td>
                              <td><span className="badge badge-info">{d.category}</span></td>
                              <td style={{ color: d.current_stock === 0 ? 'var(--rose)' : 'var(--emerald)', fontWeight: 700 }}>
                                {d.current_stock}
                              </td>
                              <td style={{ color: d.out_of_stock ? 'var(--text-muted)' : 'var(--cyan)' }}>
                                {d.out_of_stock ? '—' : d.daily_avg_predicted}
                              </td>
                              <td style={{ color: d.out_of_stock ? 'var(--text-muted)' : 'var(--indigo)', fontWeight: 700 }}>
                                {d.out_of_stock ? '0 (no stock)' : d.predicted_7d_demand}
                              </td>
                              <td style={{ color: d.unmet_7d_demand > 0 && d.out_of_stock ? 'var(--rose)' : 'var(--text-muted)', fontWeight: d.out_of_stock ? 700 : 400 }}>
                                {d.out_of_stock ? `⚠ ${d.unmet_7d_demand} units needed` : '—'}
                              </td>
                              <td style={{
                                color: d.stock_coverage_days < 14 ? 'var(--rose)' :
                                       d.stock_coverage_days < 30 ? 'var(--amber)' : 'var(--emerald)'
                              }}>
                                {d.out_of_stock ? <span style={{ color: 'var(--rose)' }}>0d</span> : `${d.stock_coverage_days}d`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB: Expiry Risk
          ══════════════════════════════════════ */}
          {activeTab === 'risk' && (
            <div className="animate-fade-in">
              {loading.risk ? (
                <div className="loader"><div className="spinner" />Running Random Forest risk classification…</div>
              ) : (
                <>
                  {/* Risk distribution bar */}
                  <div className="glass-card card-pad" style={{ marginBottom: 24 }}>
                    <div className="section-title" style={{ marginBottom: 20 }}>
                      <span className="dot dot-rose" />Risk Distribution (Random Forest)
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                      {['High', 'Medium', 'Low'].map(level => {
                        const count = riskData.filter(r => r.risk_level === level).length;
                        const color = level === 'High' ? 'var(--rose)' : level === 'Medium' ? 'var(--amber)' : 'var(--emerald)';
                        return (
                          <div key={level} className="glass-card" style={{ padding: '16px 24px', flex: 1, minWidth: 140, textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{count}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{level} Risk Medicines</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Risk Table */}
                  <div className="glass-card card-pad">
                    <div style={{ overflowX: 'auto' }}>
                      <table className="intel-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Medicine</th>
                            <th>Category</th>
                            <th>Risk Level</th>
                            <th>Expiry (days)</th>
                            <th>Stock</th>
                            <th>Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {riskData.map((r, i) => (
                            <tr key={i}>
                              <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                              <td style={{ fontWeight: 600 }}>{r.medicine}</td>
                              <td><span className="badge badge-info">{r.category}</span></td>
                              <td><RiskBadge level={r.risk_level} /></td>
                              <td style={{
                                fontWeight: 700,
                                color: r.expiry_days_left < 30 ? 'var(--rose)' :
                                       r.expiry_days_left < 90 ? 'var(--amber)' : 'var(--emerald)'
                              }}>
                                {r.expiry_days_left}d
                              </td>
                              <td>{r.current_stock}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 6, minWidth: 60 }}>
                                    <div style={{
                                      width: `${r.confidence}%`, height: '100%',
                                      background: r.risk_level === 'High' ? 'var(--rose)' : r.risk_level === 'Medium' ? 'var(--amber)' : 'var(--emerald)',
                                      borderRadius: 4
                                    }} />
                                  </div>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.confidence}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB: Recommendations
          ══════════════════════════════════════ */}
          {activeTab === 'recs' && (
            <div className="animate-fade-in">
              {loading.recs ? (
                <div className="loader"><div className="spinner" />Generating recommendations…</div>
              ) : (
                <>
                  {/* Critical alerts first */}
                  {recData.filter(r => r.action_type === 'danger').length > 0 && (
                    <div className="alert-banner alert-danger" style={{ marginBottom: 20 }}>
                      🚨 {recData.filter(r => r.action_type === 'danger').length} critical issues require immediate attention!
                    </div>
                  )}

                  <div className="grid-auto" style={{ marginBottom: 24 }}>
                    {recData.map((rec, i) => (
                      <div key={i} className={`rec-card ${rec.action_type}`}>
                        <div className={`rec-action-type ${rec.action_type}`}>
                          <ActionBadge type={rec.action_type} />
                        </div>
                        <div className="rec-medicine" style={{ marginTop: 10 }}>{rec.medicine}</div>
                        <div className="rec-category">{rec.category}</div>
                        <div style={{
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: 8, padding: '10px 14px',
                          fontSize: '0.85rem', fontWeight: 600,
                          color: rec.action_type === 'danger' ? 'var(--rose)' :
                                 rec.action_type === 'warning' ? 'var(--amber)' :
                                 rec.action_type === 'success' ? 'var(--emerald)' : 'var(--cyan)',
                          marginBottom: 14
                        }}>
                          {rec.action}
                        </div>
                        <div className="rec-meta">
                          <div className="rec-meta-item">Stock <span>{rec.current_stock}</span></div>
                          <div className="rec-meta-item">Expiry <span>{rec.expiry_days_left}d</span></div>
                          <div className="rec-meta-item">7d Demand <span>{rec.predicted_7d_demand}</span></div>
                          <div className="rec-meta-item">Coverage <span>{rec.stock_coverage_days}d</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default IntelHub;
