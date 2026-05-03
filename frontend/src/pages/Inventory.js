import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';


const Inventory = () => {
  const [data, setData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [form, setForm] = useState({ name: '', quantity: '', expiry_date: '', price: '', supplier: '' });

  useEffect(() => { fetchData(); fetchSuppliers(); }, []);

  const fetchData = async () => {
    try { const r = await API.get('/inventory/medicines/'); setData(r.data); }
    catch (err) { console.error('Error fetching medicines:', err); }
  };
  const fetchSuppliers = async () => {
    try { const r = await API.get('/suppliers/'); setSuppliers(r.data); }
    catch (err) { console.error('Error fetching suppliers:', err); }
  };

  const handleAdd = async () => {
    if (!form.name || !form.quantity) return alert('Name & Quantity required');
    try {
      await API.post('/inventory/medicines/', {
        ...form, quantity: parseInt(form.quantity), price: parseFloat(form.price), supplier: form.supplier || null
      });
      setForm({ name: '', quantity: '', expiry_date: '', price: '', supplier: '' });
      fetchData();
    } catch { alert('Add failed'); }
  };

  const handleSave = async () => {
    await API.put(`/inventory/medicines/${editingId}/`, editedData);
    setEditingId(null); fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    await API.delete(`/inventory/medicines/${id}/`); fetchData();
  };

  const filtered = data.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <div className="page-inner">

          <div className="page-header">
            <h1>Inventory</h1>
            <p>Manage your medicine catalogue, stock levels, and expiry dates.</p>
          </div>


          {/* Add Medicine Form */}
          <div className="glass-card card-pad" style={{ marginBottom: 24 }}>
            <div className="section-title" style={{ marginBottom: 18 }}>
              <span className="dot dot-cyan" /> Add New Medicine
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              {[
                { ph: 'Medicine name', key: 'name', type: 'text' },
                { ph: 'Quantity', key: 'quantity', type: 'number' },
                { ph: 'Price (₹)', key: 'price', type: 'number' },
              ].map(({ ph, key, type }) => (
                <input key={key} type={type} placeholder={ph}
                  className="form-input" style={{ flex: '1 1 160px' }}
                  value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                />
              ))}
              <input type="date" className="form-input" style={{ flex: '1 1 160px' }}
                value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
              <select className="form-select" style={{ flex: '1 1 160px' }}
                value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button className="btn btn-primary" onClick={handleAdd}>+ Add Medicine</button>
            </div>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <input className="form-input" placeholder="🔍 Search medicines…"
              style={{ flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Table */}
          <div className="glass-card card-pad">
            <div className="section-title" style={{ marginBottom: 16 }}>
              <span className="dot dot-indigo" /> Medicine List
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                {filtered.length} results
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="intel-table">
                <thead>
                  <tr>
                    <th>Medicine</th><th>Stock</th><th>Supplier</th>
                    <th>Expiry Date</th><th>Price</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>
                        {editingId === m.id
                          ? <input className="form-input" value={editedData.name}
                            onChange={e => setEditedData({ ...editedData, name: e.target.value })} />
                          : m.name}
                      </td>
                      <td style={{ fontWeight: 700, color: m.quantity <= 0 ? 'var(--rose)' : 'var(--emerald)' }}>
                        {editingId === m.id
                          ? <input type="number" className="form-input" style={{ width: 80 }} value={editedData.quantity}
                            onChange={e => setEditedData({ ...editedData, quantity: e.target.value })} />
                          : m.quantity}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.supplier_name || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {editingId === m.id
                          ? <input type="date" className="form-input" value={editedData.expiry_date}
                            onChange={e => setEditedData({ ...editedData, expiry_date: e.target.value })} />
                          : m.expiry_date}
                      </td>
                      <td>₹{m.price}</td>
                      <td>
                        {m.quantity <= 0
                          ? <span className="badge" style={{ background: 'var(--grad-danger)', color: '#fff', border: 'none' }}>✗ Out of Stock</span>
                          : <span className="badge badge-low">✓ OK</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {editingId === m.id ? (
                            <>
                              <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={handleSave}>Save</button>
                              <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => setEditingId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                onClick={() => { setEditingId(m.id); setEditedData(m); }}>Edit</button>
                              <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                onClick={() => handleDelete(m.id)}>Delete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No medicines found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Inventory;