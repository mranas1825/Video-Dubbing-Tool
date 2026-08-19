import React, { useState } from 'react';
import { Sliders, Plus, Check, Trash2, Download } from 'lucide-react';

export default function PresetsView({ presets, setPresets, settings, setSettings }) {
  const [presetName, setPresetName] = useState('');

  const defaultPresets = [
    {
      name: 'High Quality Multilingual Dub',
      removeVoice: true,
      hqDemucs: true,
      ambientLevel: 40,
      spokenLang: 'Auto-Detect',
      whisperAccuracy: 'High Quality',
      targetLanguage: 'Spanish',
      enableAiRewrite: true,
      rewriteTone: 'Engaging & Smooth',
      burnCaptions: true,
    },
    {
      name: 'Fast Bulk Dub (Minimal Demucs)',
      removeVoice: true,
      hqDemucs: false,
      ambientLevel: 20,
      spokenLang: 'Auto-Detect',
      whisperAccuracy: 'Fast',
      targetLanguage: 'English',
      enableAiRewrite: false,
      rewriteTone: 'Casual',
      burnCaptions: false,
    }
  ];

  const allPresets = [...defaultPresets, ...presets];

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    const newPreset = {
      name: presetName.trim(),
      ...settings
    };
    if (window.electronAPI) {
      const updated = await window.electronAPI.savePreset(newPreset);
      setPresets(updated);
    } else {
      setPresets(prev => [...prev, newPreset]);
    }
    setPresetName('');
  };

  const handleApplyPreset = (preset) => {
    setSettings(prev => ({
      ...prev,
      ...preset
    }));
    alert(`Preset "${preset.name}" applied successfully!`);
  };

  return (
    <div className="view-container">
      {/* Save current settings as preset */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={18} color="var(--accent-primary)" /> Save Current Configuration as Preset
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '600px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. YouTube Shorts Spanish Preset..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSavePreset} disabled={!presetName.trim()}>
            <Plus size={16} /> Save Preset
          </button>
        </div>
      </div>

      {/* Preset List */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Saved & Preset Profiles
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {allPresets.map((preset, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between'
              }}
            >
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: '#FFFFFF' }}>
                  {preset.name}
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                  <div>🎯 Target: <strong>{preset.targetLanguage}</strong></div>
                  <div>⚡ Accuracy: <strong>{preset.whisperAccuracy}</strong></div>
                  <div>🎙️ Demucs Vocal Separation: <strong>{preset.hqDemucs ? 'HQ Enabled' : 'Fast Mode'}</strong></div>
                  <div>✨ AI Rewrite: <strong>{preset.enableAiRewrite ? preset.rewriteTone : 'Disabled'}</strong></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}
                  onClick={() => handleApplyPreset(preset)}
                >
                  <Check size={14} /> Apply Preset
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
