import React from 'react';
import { Layers, Sliders, Settings, Terminal, Sparkles } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'queue', label: 'Video Queue', icon: Layers },
    { id: 'presets', label: 'Presets', icon: Sliders },
    { id: 'settings', label: 'Settings & API', icon: Settings },
    { id: 'console', label: 'Activity Log', icon: Terminal },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2rem' }}>
          <div className="logo-icon" style={{ width: 44, height: 44, borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(99, 102, 241, 0.4)', boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)' }}>
            <img src={logoImg} alt="DubCraft AI Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1 className="logo-text" style={{ fontSize: '1.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #FFFFFF 30%, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              DubCraft AI
            </h1>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.05em' }}>
              MULTILINGUAL STUDIO
            </span>
          </div>
        </div>

        <nav className="nav-group">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          AI Engine Status
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--accent-success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-success)', display: 'inline-block' }}></span>
          Free Engine (Edge-TTS Ready)
        </div>
      </div>
    </aside>
  );
}
