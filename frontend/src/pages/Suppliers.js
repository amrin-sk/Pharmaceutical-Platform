import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';

const Suppliers = () => {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({ name: '', contact: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try { const r = await API.get('/suppliers/'); setData(r.data); } catch {}
  };

  const handleAdd = async () => {
    if (!form.name || !form.contact) return alert('Name & Contact required');
    setSaving(true);
    try {
      await API.post('/suppliers/', form);
      setForm({ name: '', contact: '', email: '', address: '' });
      fetchSuppliers();
    } catch { alert('Error adding supplier'); }
    setSaving(false);
  };

  const initials = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarColor = (name) => {
    const colors = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <div className="page-inner">

          <div className="page-header">
            <h1>Suppliers</h1>
            <p>Manage your medicine suppliers and vendor contacts.</p>
          </div>

          {/* Form */}
          <div className="glass-card card-pad" style={{ marginBottom: 24 }}>
            <div className="section-title" style={{ marginBottom: 18 }}>
              <span className="dot dot-cyan" /> Add Supplier
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { ph: 'Company name *', key: 'name' },
                { ph: 'Contact number *', key: 'contact' },
                { ph: 'Email address', key: 'email' },
                { ph: 'Address', key: 'address' },
              ].map(({ ph, key }) => (
                <input key={key} className="form-input" placeholder={ph}
                  value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? 'Adding…' : '+ Add Supplier'}
              </button>
            </div>
          </div>

          {/* Supplier cards */}
          <div className="section-title" style={{ marginBottom: 16 }}>
            <span className="dot dot-indigo" /> Supplier Directory
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              {data.length} suppliers
            </span>
          </div>

          {data.length === 0 ? (
            <div className="glass-card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏭</div>
              No suppliers yet. Add your first supplier above.
            </div>
          ) : (
            <div className="grid-auto">
              {data.map(s => (
                <div key={s.id} className="glass-card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: avatarColor(s.name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '1rem', color: '#fff', flexShrink: 0
                    }}>
                      {initials(s.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supplier ID #{s.id}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {s.contact && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                        <span>📞</span> {s.contact}
                      </div>
                    )}
                    {s.email && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                        <span>✉️</span> {s.email}
                      </div>
                    )}
                    {s.address && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                        <span>📍</span> {s.address}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Suppliers;