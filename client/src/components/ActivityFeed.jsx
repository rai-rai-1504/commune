import React, { useState, useEffect, useRef } from 'react';

export default function ActivityFeed({ events, maxHeight = 180 }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  if (!events || events.length === 0) {
    return (
      <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>
        No activity yet.
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', maxHeight }}>
      {events.map((ev, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 7,
          padding: '5px 0', borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{ev.icon || '●'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: ev.color || 'var(--text2)' }}>{ev.text}</span>
            {ev.time && (
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
                {new Date(ev.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
