import React, { useState, useEffect } from 'react';
import { Layers, Sliders, Settings, Terminal, Key, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

export default function Sidebar({ activeTab, setActiveTab, settings, setSettings }) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [showKeys, setShowKeys] = useState({ elevenlabs: false, claude: false, groq: false });
  const [validationState, setValidationState] = useState({
    elevenlabs: { isValidating: false, isValid: null, error: null, usage: null },
    claude: { isValidating: false, isValid: null, error: null },
    groq: { isValidating: false, isValid: null, error: null }
  });

  const navItems = [
    { id: 'queue', label: 'Video Queue', icon: Layers },
    { id: 'presets', label: 'Presets', icon: Sliders },
    { id: 'settings', label: 'Settings & Storage', icon: Settings },
    { id: 'console', label: 'Activity Log', icon: Terminal },
  ];

  // Auto-validate loaded keys on startup or settings update
  useEffect(() => {
    if (settings?.elevenLabsApiKey || settings?.paidTtsKey) {
      validateKey('elevenlabs', settings.elevenLabsApiKey || settings.paidTtsKey);
    }
    if (settings?.claudeApiKey) {
      validateKey('claude', settings.claudeApiKey);
    }
    if (settings?.groqApiKey) {
      validateKey('groq', settings.groqApiKey);
    }
  }, []);

  const validateKey = async (service, apiKey) => {
    if (!apiKey || !apiKey.trim()) {
      setValidationState(prev => ({
        ...prev,
        [service]: { isValidating: false, isValid: null, error: null, usage: null }
      }));
      return;
    }

    setValidationState(prev => ({
      ...prev,
      [service]: { ...prev[service], isValidating: true, error: null }
    }));

    if (window.electronAPI && window.electronAPI.validateApiKey) {
      const res = await window.electronAPI.validateApiKey({ service, apiKey });
      if (res.success) {
        setValidationState(prev => ({
          ...prev,
          [service]: { isValidating: false, isValid: true, error: null, usage: res.usage || null }
        }));
      } else {
        setValidationState(prev => ({
          ...prev,
          [service]: { isValidating: false, isValid: false, error: res.error || 'Invalid key', usage: null }
        }));
      }
    } else {
      // Browser demo mode fallback
      setTimeout(() => {
        setValidationState(prev => ({
          ...prev,
          [service]: {
            isValidating: false,
            isValid: true,
            error: null,
            usage: service === 'elevenlabs' ? { used: 3200, limit: 10000, percent: 32 } : null
          }
        }));
      }, 600);
    }
  };

  const handleKeyChange = (service, value) => {
    if (!setSettings) return;
    if (service === 'elevenlabs') {
      setSettings(prev => ({ ...prev, elevenLabsApiKey: value, paidTtsKey: value }));
    } else if (service === 'claude') {
      setSettings(prev => ({ ...prev, claudeApiKey: value }));
    } else if (service === 'groq') {
      setSettings(prev => ({ ...prev, groqApiKey: value }));
    }
  };

  const handleKeyBlur = (service, value) => {
    if (window.electronAPI && setSettings) {
      window.electronAPI.saveSettings(settings);
    }
    validateKey(service, value);
  };

  const toggleShowKey = (service) => {
    setShowKeys(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const renderStatusIcon = (state) => {
    if (state.isValidating) return <RefreshCw className="spin" size={13} color="var(--accent-secondary)" />;
    if (state.isValid === true) return <CheckCircle size={13} color="#10B981" title="API Key Verified & Active" />;
    if (state.isValid === false) return <XCircle size={13} color="#EF4444" title={state.error || "Invalid API Key"} />;
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6B7280', display: 'inline-block' }} title="Not Configured" />;
  };

  const getUsageBarColor = (percent) => {
    if (percent >= 80) return '#EF4444'; // Red warning
    if (percent >= 60) return '#F59E0B'; // Yellow warning
    return '#10B981'; // Green clean
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div className="logo-icon" style={{ width: 42, height: 42, borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(99, 102, 241, 0.4)', boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)' }}>
            <img src={logoImg} alt="DubCraft AI Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1 className="logo-text" style={{ fontSize: '1.15rem', fontWeight: 800, background: 'linear-gradient(135deg, #FFFFFF 30%, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              DubCraft AI
            </h1>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.05em' }}>
              MULTILINGUAL STUDIO
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="nav-group" style={{ marginBottom: '1.25rem' }}>
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

        {/* FIX 4: Quick API Management Panel */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div
            onClick={() => setPanelOpen(!panelOpen)}
            style={{
              padding: '0.6rem 0.75rem',
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Key size={14} color="var(--accent-primary)" />
              <span>API Key Manager</span>
            </div>
            {panelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>

          {panelOpen && (
            <div style={{ padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              
              {/* Row 1: ElevenLabs API Key */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ElevenLabs</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {renderStatusIcon(validationState.elevenlabs)}
                    {validationState.elevenlabs.error && (
                      <span title={validationState.elevenlabs.error} style={{ cursor: 'pointer' }}>
                        <Info size={11} color="#EF4444" />
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showKeys.elevenlabs ? 'text' : 'password'}
                    className="input-field"
                    placeholder="sk_..."
                    value={settings?.elevenLabsApiKey || settings?.paidTtsKey || ''}
                    onChange={(e) => handleKeyChange('elevenlabs', e.target.value)}
                    onBlur={(e) => handleKeyBlur('elevenlabs', e.target.value)}
                    style={{ fontSize: '0.72rem', padding: '0.35rem 1.6rem 0.35rem 0.5rem', height: '28px' }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('elevenlabs')}
                    style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showKeys.elevenlabs ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>

                {/* ElevenLabs Quota Usage Progress Bar */}
                {validationState.elevenlabs.usage && (
                  <div style={{ marginTop: '0.35rem', background: 'rgba(0,0,0,0.4)', padding: '0.35rem 0.45rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                      <span>{validationState.elevenlabs.usage.used.toLocaleString()} / {validationState.elevenlabs.usage.limit.toLocaleString()} credits</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 700, color: getUsageBarColor(validationState.elevenlabs.usage.percent) }}>
                          {validationState.elevenlabs.usage.percent}%
                        </span>
                        <RefreshCw
                          size={10}
                          style={{ cursor: 'pointer' }}
                          onClick={() => validateKey('elevenlabs', settings?.elevenLabsApiKey || settings?.paidTtsKey)}
                        />
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${validationState.elevenlabs.usage.percent}%`,
                          height: '100%',
                          background: getUsageBarColor(validationState.elevenlabs.usage.percent),
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Claude API Key */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Claude (Anthropic)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {renderStatusIcon(validationState.claude)}
                    {validationState.claude.error && (
                      <span title={validationState.claude.error} style={{ cursor: 'pointer' }}>
                        <Info size={11} color="#EF4444" />
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showKeys.claude ? 'text' : 'password'}
                    className="input-field"
                    placeholder="sk-ant-..."
                    value={settings?.claudeApiKey || ''}
                    onChange={(e) => handleKeyChange('claude', e.target.value)}
                    onBlur={(e) => handleKeyBlur('claude', e.target.value)}
                    style={{ fontSize: '0.72rem', padding: '0.35rem 1.6rem 0.35rem 0.5rem', height: '28px' }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('claude')}
                    style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showKeys.claude ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>

              {/* Row 3: Groq API Key */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Groq (Free Cloud)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {renderStatusIcon(validationState.groq)}
                    {validationState.groq.error && (
                      <span title={validationState.groq.error} style={{ cursor: 'pointer' }}>
                        <Info size={11} color="#EF4444" />
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showKeys.groq ? 'text' : 'password'}
                    className="input-field"
                    placeholder="gsk_..."
                    value={settings?.groqApiKey || ''}
                    onChange={(e) => handleKeyChange('groq', e.target.value)}
                    onBlur={(e) => handleKeyBlur('groq', e.target.value)}
                    style={{ fontSize: '0.72rem', padding: '0.35rem 1.6rem 0.35rem 0.5rem', height: '28px' }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('groq')}
                    style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showKeys.groq ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* AI Engine Status Footer */}
      <div style={{ padding: '0.65rem 0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          AI Processing Engine
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--accent-success)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-success)', display: 'inline-block' }}></span>
          NVIDIA RTX GPU + Edge-TTS Ready
        </div>
      </div>
    </aside>
  );
}
