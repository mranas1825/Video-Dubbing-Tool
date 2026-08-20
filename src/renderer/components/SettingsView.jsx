import React from 'react';
import { Folder, Save, ShieldCheck, Cpu } from 'lucide-react';

export default function SettingsView({ settings, setSettings }) {
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
      {/* Output & Export Directory Panel */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Folder size={18} color="var(--accent-secondary)" /> Default Output Directory
        </h3>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <input
            type="text"
            className="input-field"
            readOnly
            value={settings.exportFolder || 'D:\\Dubbed Craft AI'}
          />
          <button className="btn btn-secondary" onClick={handleSelectExportFolder}>
            Choose Folder
          </button>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Exported dubbed video files and isolated audio tracks will be automatically saved inside this folder.
        </p>
      </div>

      {/* Hardware & Processing Preferences */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={18} color="var(--accent-primary)" /> Hardware & Processing Options
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>NVIDIA CUDA GPU Acceleration</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatically uses RTX 5050 CUDA 12.4 for Whisper ASR & Demucs</div>
            </div>
            <input
              type="checkbox"
              checked={true}
              readOnly
              style={{ width: 18, height: 18, accentColor: '#10B981' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Keep Temporary Audio Stems</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saves separated vocals and instrumental MP3 files alongside output</div>
            </div>
            <input
              type="checkbox"
              checked={settings.keepStems || false}
              onChange={(e) => setSettings({ ...settings, keepStems: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
            />
          </label>
        </div>

        <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: '0.65rem 1.5rem' }}>
            <Save size={16} /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
