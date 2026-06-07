import React from 'react';
import { useStore } from '../store/useStore';

export default function Notifications() {
  const notifications = useStore(s => s.notifications);
  return (
    <div className="notif-container">
      {notifications.map(n => <div key={n.id} className="notif-item">{n.text}</div>)}
    </div>
  );
}
