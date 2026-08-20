import React, { useState } from 'react';
import { Key, Folder, Mic, Subtitles, Save, Eye, EyeOff, Check, RefreshCw, AlertTriangle, Music } from 'lucide-react';

export default function SettingsView({ settings, setSettings }) {
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showPaidTtsKey, setShowPaidTtsKey] = useState(false);
  const [fetchingVoice, setFetchingVoice] = useState(false);
  const [voiceDetails, setVoiceDetails] = useState(null);
  const [voiceError, setVoiceError] = useState('');

  const handleSave = async () => {
    if (window.electronAPI) {
      await window.electronAPI.saveSettings(settings);
    }
    alert('Settings saved successfully!');
  };

  const handleSelectExportFolder = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.selectFolder();
      if (res && res.folderPath) {
        setSettings({ ...settings, exportFolder: res.folderPath });
      }
    }
  };

  const handleFetchVoiceDetails = async () => {
    const apiKey = settings.elevenLabsApiKey || settings.paidTtsKey || '';
    const voiceId = settings.elevenLabsVoiceId || '';
    if (!voiceId.trim()) {
      setVoiceError('Please enter a valid ElevenLabs Voice ID first.');
      return;
    }

    setFetchingVoice(true);
    setVoiceError('');
    setVoiceDetails(null);

    if (window.electronAPI && window.electronAPI.fetchElevenLabsVoice) {
      const res = await window.electronAPI.fetchElevenLabsVoice({ apiKey, voiceId });
      setFetchingVoice(false);
      if (res.success) {
        setVoiceDetails(res.voice);
      } else {
        setVoiceError(res.error || 'Failed to fetch voice details.');
      }
    } else {
      // Browser demo fallback
      setTimeout(() => {
        setFetchingVoice(false);
        setVoiceDetails({
          voice_id: voiceId,
          name: 'Adam (Preview Demo)',
          category: 'premade',
          description: 'Deep, resonant male voice perfect for narrations and dubbing.',
          preview_url: 'https://storage.googleapis.com/eleven-public-voices/voices/pNInz6obpgDQGcFmaJgB/manifest.json'
        });
      }, 1000);
    }
  };

  const CAPTION_STYLES = [
    {
      id: 'teal_karaoke',
      name: 'Teal Karaoke Box',
      desc: 'Solid Teal/Cyan background box with white text (Highlighted word pop)',
      previewStyle: {
        background: '#00D9B3',
        color: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(0,217,179,0.4)',
        padding: '4px 10px',
        borderRadius: '4px'
      },
      sampleText: 'THE QUICK BROWN'
    },
    {
      id: 'classic_white',
      name: 'Classic White',
      desc: 'Plain white bold text with clean subtle shadow',
      previewStyle: {
        color: '#FFFFFF',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        fontWeight: 'bold'
      },
      sampleText: 'THE QUICK BROWN'
    },
    {
      id: 'yellow_stroke',
      name: 'Yellow Stroke',
      desc: 'Vibrant yellow text with thick black outline',
      previewStyle: {
        color: '#FFFF00',
        WebkitTextStroke: '1px #000000',
        fontWeight: '900'
      },
      sampleText: 'THE QUICK BROWN'
    },
    {
      id: 'white_box',
      name: 'White Black Box',
      desc: 'White text on opaque solid black box',
      previewStyle: {
        background: '#000000',
        color: '#FFFFFF',
        padding: '4px 10px',
        borderRadius: '4px',
        border: '1px solid #333'
      },
      sampleText: 'THE QUICK BROWN'
    },
    {
      id: 'bold_caps_box',
      name: 'Bold Caps Dark',
      desc: 'Uppercase bold text on dark translucent container',
      previewStyle: {
        background: 'rgba(17,17,17,0.85)',
        color: '#F3F4F6',
        padding: '4px 10px',
        borderRadius: '4px',
        border: '1px solid rgba(255,255,255,0.1)'
      },
      sampleText: 'THE QUICK BROWN'
    }
  ];

  return (
    <div className="view-container">
      {/* FEATURE 1 & 2: Voice Settings & ElevenLabs Integration */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mic size={18} color="var(--accent-primary)" /> Neural Voiceover & TTS Settings
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Voice Gender Selection (Feature 1) */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Free TTS Voice Gender Selection (Edge-TTS)
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '8px',
                  background: settings.voiceGender === 'Male' || !settings.voiceGender ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
                  border: settings.voiceGender === 'Male' || !settings.voiceGender ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <input
                  type="radio"
                  name="voiceGender"
                  value="Male"
                  checked={settings.voiceGender === 'Male' || !settings.voiceGender}
                  onChange={() => setSettings({ ...settings, voiceGender: 'Male' })}
                />
                ♂️ Male Voice (Default)
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '8px',
                  background: settings.voiceGender === 'Female' ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
                  border: settings.voiceGender === 'Female' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <input
                  type="radio"
                  name="voiceGender"
                  value="Female"
                  checked={settings.voiceGender === 'Female'}
                  onChange={() => setSettings({ ...settings, voiceGender: 'Female' })}
                />
                ♀️ Female Voice
              </label>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Select gender preference for free high-quality neural voice synthesis across 45+ supported languages.
            </p>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '0.25rem 0' }} />

          {/* ElevenLabs Integration Toggle & Auto-Fetch (Feature 2) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Use ElevenLabs Custom Voice
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Use your ElevenLabs API Key & Voice ID for voice cloning and high-fidelity custom speech.
                </p>
              </div>

              <div
                className={`toggle-switch ${settings.useElevenLabs ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, useElevenLabs: !settings.useElevenLabs })}
              >
                <div className="toggle-thumb" />
              </div>
            </div>

            {settings.useElevenLabs && (
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    ElevenLabs API Key
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPaidTtsKey ? 'text' : 'password'}
                      className="input-field"
                      placeholder="sk_..."
                      value={settings.elevenLabsApiKey || settings.paidTtsKey || ''}
                      onChange={(e) => setSettings({ ...settings, elevenLabsApiKey: e.target.value, paidTtsKey: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPaidTtsKey(!showPaidTtsKey)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showPaidTtsKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    Voice ID (Paste from ElevenLabs Voice Library)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                      value={settings.elevenLabsVoiceId || ''}
                      onChange={(e) => setSettings({ ...settings, elevenLabsVoiceId: e.target.value })}
                      onBlur={() => { if (settings.elevenLabsVoiceId) handleFetchVoiceDetails(); }}
                    />
                    <button className="btn btn-secondary" onClick={handleFetchVoiceDetails} disabled={fetchingVoice} style={{ whiteSpace: 'nowrap' }}>
                      {fetchingVoice ? <RefreshCw className="spin" size={14} /> : <Check size={14} />} Fetch Details
                    </button>
                  </div>
                </div>

                {/* Voice Error Display */}
                {voiceError && (
                  <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} /> {voiceError}
                  </div>
                )}

                {/* Fetched Voice Info Card */}
                {voiceDetails && (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', padding: '0.85rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, color: '#6EE7B7', fontSize: '0.9rem' }}>
                        🗣️ {voiceDetails.name}
                      </span>
                      <span className="status-badge status-done" style={{ fontSize: '0.7rem' }}>
                        Category: {voiceDetails.category || 'Custom'}
                      </span>
                    </div>
                    {voiceDetails.description && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                        {voiceDetails.description}
                      </p>
                    )}
                    {voiceDetails.preview_url && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Voice Sample Preview:</label>
                        <audio src={voiceDetails.preview_url} controls style={{ height: '30px', width: '100%' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FEATURE 3: Caption Toggle + CapCut Visual Style Templates */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Subtitles size={18} color="var(--accent-secondary)" /> Captions & CapCut Visual Style Templates
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Captions Toggle Switch */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Add Burned-In Captions to Exported Videos
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                When turned OFF, subtitle generation and overlay burn-in are completely skipped.
              </p>
            </div>
            <div
              className={`toggle-switch ${settings.burnCaptions ?? true ? 'active' : ''}`}
              onClick={() => setSettings({ ...settings, burnCaptions: !(settings.burnCaptions ?? true) })}
            >
              <div className="toggle-thumb" />
            </div>
          </div>

          {/* CapCut Preset Model Gallery */}
          {(settings.burnCaptions ?? true) && (
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Select Caption Style Preset (CapCut Models)
              </label>

              <div className="caption-preset-grid">
                {CAPTION_STYLES.map(style => {
                  const isActive = (settings.captionStyle || 'teal_karaoke') === style.id;
                  return (
                    <div
                      key={style.id}
                      className={`caption-preset-card ${isActive ? 'active' : ''}`}
                      onClick={() => setSettings({ ...settings, captionStyle: style.id })}
                    >
                      <div className="caption-preview-box">
                        <span style={style.previewStyle}>{style.sampleText}</span>
                      </div>
                      <div style={{ textAlign: 'center', marginTop: '0.2rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
                          {style.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                          {style.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Key Credentials Panel */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={18} color="var(--accent-primary)" /> API Credentials
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Groq Key */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Groq API Key <span style={{ color: '#10B981', fontWeight: 600 }}>(100% Free Cloud Whisper)</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="gsk_..."
              value={settings.groqApiKey || ''}
              onChange={(e) => setSettings({ ...settings, groqApiKey: e.target.value })}
            />
          </div>

          {/* Claude Key */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Claude API Key (Anthropic)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showClaudeKey ? 'text' : 'password'}
                className="input-field"
                placeholder="sk-ant-..."
                value={settings.claudeApiKey || ''}
                onChange={(e) => setSettings({ ...settings, claudeApiKey: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowClaudeKey(!showClaudeKey)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showClaudeKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export & Save Panel */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Folder size={18} color="var(--accent-secondary)" /> Output Folder
        </h3>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="input-field"
            readOnly
            value={settings.exportFolder || 'Default: ./exports'}
          />
          <button className="btn btn-secondary" onClick={handleSelectExportFolder}>
            Choose Folder
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: '0.65rem 1.5rem' }}>
            <Save size={16} /> Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
}
