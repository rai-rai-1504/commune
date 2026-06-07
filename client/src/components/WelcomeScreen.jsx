import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function WelcomeScreen({ onEnter }) {
  const { username, setUsername } = useStore();
  const [name, setName] = useState(username || '');
  const [error, setError] = useState('');

  function enter() {
    const clean = name.trim();
    if (clean.length < 2) { setError('Name must be at least 2 characters'); return; }
    if (clean.length > 20) { setError('Name must be 20 characters or less'); return; }
    setUsername(clean);
    onEnter();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0c1018',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'linear-gradient(var(--border2) 1px, transparent 1px), linear-gradient(90deg, var(--border2) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(78,205,196,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', textAlign: 'center', maxWidth: 480, width: '90%',
        background: 'rgba(22,27,38,0.9)', border: '1px solid rgba(78,205,196,0.2)',
        borderRadius: 20, padding: '44px 40px',
        boxShadow: '0 0 80px rgba(78,205,196,0.08), 0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏙️</div>
        <div style={{ fontSize: 38, fontWeight: 800, color: '#4ECDC4', letterSpacing: -1.5, marginBottom: 4 }}>
          commune
        </div>
        <div style={{ fontSize: 14, color: '#8892a4', marginBottom: 32, letterSpacing: 0.5 }}>
          collaborative 3D city builder
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {[
            { icon: '✏️', label: '3D Editor' },
            { icon: '🏙️', label: 'City Zoning' },
            { icon: '🏛️', label: 'Governance' },
            { icon: '🚶', label: 'Street View' },
            { icon: '🔴', label: 'Live Collab' },
          ].map(f => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 20,
              background: 'rgba(78,205,196,0.08)', border: '1px solid rgba(78,205,196,0.15)',
              fontSize: 12, color: '#8892a4',
            }}>
              {f.icon} {f.label}
            </div>
          ))}
        </div>

        {/* Name input */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#8892a4', marginBottom: 8, textAlign: 'left' }}>
            Choose your player name
          </div>
          <input
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${error ? 'rgba(226,75,74,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10, padding: '12px 16px', color: '#e8eaf0',
              fontSize: 16, outline: 'none', fontFamily: 'inherit',
              textAlign: 'center', letterSpacing: 0.5,
            }}
            placeholder="e.g. Daksh, Mayor42, UrbanPlanner..."
            value={name}
            autoFocus
            maxLength={20}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && enter()}
            onFocus={e => { e.target.style.borderColor = 'rgba(78,205,196,0.4)'; }}
            onBlur={e => { e.target.style.borderColor = error ? 'rgba(226,75,74,0.5)' : 'rgba(255,255,255,0.1)'; }}
          />
          {error && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 6, textAlign: 'left' }}>{error}</div>}
        </div>

        <button
          onClick={enter}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 10,
            background: 'linear-gradient(135deg, #4ECDC4, #2eadab)',
            border: 'none', color: '#0c1018', fontWeight: 700,
            fontSize: 15, cursor: 'pointer', letterSpacing: 0.3,
            transition: 'opacity 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => e.target.style.opacity = '0.88'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          Enter City →
        </button>

        <div style={{ marginTop: 20, fontSize: 11, color: '#4a5568', lineHeight: 1.7 }}>
          Your city. Your decisions. Your buildings.
          <br />Multiple players can build and govern simultaneously.
        </div>
      </div>
    </div>
  );
}
