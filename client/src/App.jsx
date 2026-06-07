import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import Navbar from './components/Navbar';
import Notifications from './components/Notifications';
import WelcomeScreen from './components/WelcomeScreen';
import CityModule from './modules/city/CityModule';
import EditorModule from './modules/editor/EditorModule';
import GovernanceModule from './modules/governance/GovernanceModule';
import './App.css';

export default function App() {
  const { connect, connected, activeModule } = useStore();
  const [entered, setEntered] = useState(!!localStorage.getItem('commune_username'));

  useEffect(() => { connect(); }, []);

  if (!entered) {
    return <WelcomeScreen onEnter={() => setEntered(true)} />;
  }

  return (
    <div className="app-root">
      <Navbar />
      <div className="module-container">
        {activeModule === 'city'       && <CityModule />}
        {activeModule === 'editor'     && <EditorModule />}
        {activeModule === 'governance' && <GovernanceModule />}
      </div>
      <Notifications />
      {!connected && (
        <div className="connecting-overlay">
          <div className="connecting-box">
            <div className="spinner" />
            <span>Connecting to Commune server…</span>
          </div>
        </div>
      )}
    </div>
  );
}
