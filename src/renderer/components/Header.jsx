import React from 'react';
import { Play, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function Header({ activeTab, queueStats, onProcessAll, fullAutoMode, setFullAutoMode }) {
  const getTitle = () => {
    switch (activeTab) {
      case 'queue': return 'Video Dubbing Queue';
      case 'presets': return 'Dubbing Presets Manager';
      case 'settings': return 'App Settings & API Keys';
      case 'console': return 'Activity Console & Diagnostics';
      default: return 'Studio';
    }
  };

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 className="header-title">{getTitle()}</h2>
        
        {/* Full Auto Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.75rem', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: fullAutoMode ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
            ⚡ Full Auto Mode
          </span>
          <div 
            className={`toggle-switch ${fullAutoMode ? 'active' : ''}`}
            onClick={() => setFullAutoMode(!fullAutoMode)}
          >
            <div className="toggle-thumb"></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Stat badges */}
        {activeTab === 'queue' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="status-badge status-queued">
              <Clock size={12} /> {queueStats.queued} Queued
            </span>
            <span className="status-badge status-running">
              <Play size={12} /> {queueStats.running} Running
            </span>
            <span className="status-badge status-done">
              <CheckCircle2 size={12} /> {queueStats.done} Done
            </span>
            {queueStats.failed > 0 && (
              <span className="status-badge status-failed">
                <AlertCircle size={12} /> {queueStats.failed} Failed
              </span>
            )}

            <button className="btn btn-primary" onClick={onProcessAll} style={{ marginLeft: '0.5rem' }}>
              <Play size={16} fill="white" /> Process All
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
