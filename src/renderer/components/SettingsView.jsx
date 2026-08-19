import React, { useState } from 'react';
import { Key, Folder, Cpu, ShieldCheck, Save, Eye, EyeOff } from 'lucide-react';

export default function SettingsView({ settings, setSettings }) {
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showPaidTtsKey, setShowPaidTtsKey] = useState(false);

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

  return (
    <div className="view-container">
      {/* API Key Credentials */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={18} color="var(--accent-primary)" /> API Credentials & Key Management
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Claude Key */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Claude API Key (Anthropic) <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
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
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Required for AI script translation & rewriting. Stored securely in local app configuration.
            </p>
          </div>

          {/* Claude Model Selector */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Claude Model
            </label>
            <select
              className="input-field"
              value={settings.claudeModel || 'claude-3-5-sonnet-20241022'}
              onChange={(e) => setSettings({ ...settings, claudeModel: e.target.value })}
              style={{ maxWidth: '400px' }}
            >
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Higher Quality)</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Cost Efficient Bulk)</option>
            </select>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />

          {/* Premium TTS Provider Key (Optional) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Premium Paid TTS Provider API Key <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <span className="status-badge status-done" style={{ fontSize: '0.7rem' }}>
                {settings.paidTtsKey ? 'Premium Key Loaded' : 'Using Free Engine (Edge-TTS)'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <select
                className="input-field"
                style={{ width: '180px' }}
                value={settings.paidTtsProvider || 'ElevenLabs'}
                onChange={(e) => setSettings({ ...settings, paidTtsProvider: e.target.value })}
              >
                <option value="ElevenLabs">ElevenLabs</option>
                <option value="Azure">Azure Neural TTS</option>
                <option value="PlayHT">PlayHT</option>
              </select>

              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type={showPaidTtsKey ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Paste your API key here..."
                  value={settings.paidTtsKey || ''}
                  onChange={(e) => setSettings({ ...settings, paidTtsKey: e.target.value })}
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

            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: '#A7F3D0' }}>
              💡 <strong>Free-by-default guarantee:</strong> If this field is empty or key is invalid, DubCraft AI cleanly uses Microsoft Edge-TTS (multilingual, high naturalness) — never failing your pipeline.
            </div>
          </div>
        </div>
      </div>

      {/* Export & Preferences Panel */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Folder size={18} color="var(--accent-secondary)" /> Default Output & Storage Options
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Export Output Folder
            </label>
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
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              checked={settings.keepLocalCopy ?? true}
              onChange={(e) => setSettings({ ...settings, keepLocalCopy: e.target.checked })}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Keep local copy of processed videos and generated audio tracks</span>
          </label>
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
