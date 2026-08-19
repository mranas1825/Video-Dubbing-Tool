import React from 'react';
import { Terminal, Trash2, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function ConsoleView({ logs, setLogs }) {
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="view-container">
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Activity Console & Diagnostics</h3>
            <span className="status-badge status-queued" style={{ fontSize: '0.7rem' }}>
              {logs.length} Log Entries
            </span>
          </div>

          <button className="btn btn-secondary" onClick={clearLogs} style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>
            <Trash2 size={13} /> Clear Console
          </button>
        </div>

        {/* Console Log Output Window */}
        <div
          style={{
            flex: 1,
            background: '#06080C',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            overflowY: 'auto',
            minHeight: '400px'
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Console ready. Process activity logs and diagnostic reports will appear here in real time...
            </div>
          ) : (
            logs.map((log, index) => {
              const isError = log.type === 'error';
              const isSuccess = log.type === 'success';
              const color = isError ? '#FCA5A5' : isSuccess ? '#6EE7B7' : '#9CA3AF';
              
              return (
                <div key={index} style={{ marginBottom: '0.35rem', display: 'flex', gap: '0.6rem', color }}>
                  <span style={{ color: '#4B5563', userSelect: 'none' }}>[{log.timestamp || new Date().toLocaleTimeString()}]</span>
                  <span style={{ fontWeight: 600 }}>{isError ? 'ERR' : isSuccess ? 'OK ' : 'INF'}</span>
                  <span>{log.text}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
