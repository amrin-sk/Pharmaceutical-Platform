import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!username || !password) return setError('Please enter username and password.');
    setLoading(true); setError('');

    try {
      await API.post('/users/register/', {
        username,
        password
      });

      alert("Registration successful");
      navigate('/'); 

    } catch (err) {
      console.log("ERROR:",err.response?.data);
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
        top: -100, left: -100, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        bottom: -50, right: -50, pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', marginBottom: 16,
            boxShadow: '0 0 40px rgba(6,182,212,0.3)'
          }}>💊</div>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: 800, margin: 0,
            background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>PharmaIQ</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.9rem' }}>
            Pharmaceutical Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-card card-pad-lg">
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>Create an Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>
            Sign up to start managing your store intelligently.
          </p>

          {error && (
            <div className="alert-banner alert-danger" style={{ marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Username
              </label>
              <input
                id="register-username"
                className="form-input"
                style={{ width: '100%' }}
                placeholder="Choose a username…"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <input
                id="register-password"
                type="password"
                className="form-input"
                style={{ width: '100%' }}
                placeholder="Create a password…"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              id="register-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center', padding: '12px' }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Registering…</>
                : 'Register →'
              }
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <span
              onClick={() => navigate('/')}
              style={{ color: 'var(--cyan)', cursor: 'pointer', fontWeight: 600 }}
            >
              Sign In →
            </span>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Final Year Project · AI-Powered Medical Store Management
        </p>
      </div>
    </div>
  );
};

export default Register;