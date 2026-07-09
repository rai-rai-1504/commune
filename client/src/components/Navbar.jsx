import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import Icon from './Icon';

const TABS = [
  { id: 'city', label: 'City', iconName: 'city' },
  { id: 'editor', label: '3D Editor', iconName: 'pencil' },
  { id: 'governance', label: 'Governance', iconName: 'zone' },
];

export default function Navbar() {
  const { activeModule, setActiveModule, connected, presence, username, setUsername, clientColor, showCitiesManager } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (showCitiesManager) return null;

  return (
    <nav className="navbar">
      {TABS.map(t => (
        <button key={t.id} className={`nav-tab ${activeModule === t.id ? 'active' : ''}`} onClick={() => setActiveModule(t.id)}>
          <Icon name={t.iconName} size={14} style={{ marginRight: 6 }} /> {t.label}
        </button>
      ))}

      <div className="nav-right">
        <div className="presence-avatars">
          {presence.slice(0, 6).map((p, i) => (
            <div key={p.id} className="p-avatar" style={{ background: p.color + '33', color: p.color, zIndex: 6 - i }} title={p.username}>
              {p.username.slice(0, 2).toUpperCase()}
            </div>
          ))}
        </div>
        {editing ? (
          <input
            className="username-input"
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { if (draft.trim()) setUsername(draft.trim()); setEditing(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { if (draft.trim()) setUsername(draft.trim()); setEditing(false); } }}
          />
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }} onClick={() => { setDraft(username); setEditing(true); }}>
            @{username}
          </span>
        )}
        <div className={`conn-dot ${connected ? '' : 'off'}`} title={connected ? 'Connected' : 'Disconnected'} />
      </div>
    </nav>
  );
}
