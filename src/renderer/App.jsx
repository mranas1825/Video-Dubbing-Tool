import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import QueueView from './components/QueueView';
import PresetsView from './components/PresetsView';
import SettingsView from './components/SettingsView';
import ConsoleView from './components/ConsoleView';

export default function App() {
  const [activeTab, setActiveTab] = useState('queue');
  const [queue, setQueue] = useState([]);
  const [presets, setPresets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [fullAutoMode, setFullAutoMode] = useState(true);

  const [settings, setSettings] = useState({
    claudeApiKey: '',
    claudeModel: 'claude-3-5-sonnet-20241022',
    paidTtsProvider: 'ElevenLabs',
    paidTtsKey: '',
    spokenLang: 'Auto-Detect',
    whisperAccuracy: 'Fast',
    targetLanguage: 'Spanish',
    removeVoice: true,
    hqDemucs: false,
    ambientLevel: 40,
    enableAiRewrite: false,

    rewriteTone: 'Engaging & Smooth',
    customPrompt: '',
    burnCaptions: true,
    exportFolder: '',
    keepLocalCopy: true
  });

  // Load saved settings & listen to log events via IPC
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSettings().then(saved => {
        if (saved && Object.keys(saved).length > 0) {
          setSettings(prev => ({ ...prev, ...saved }));
        }
      });

      window.electronAPI.getPresets().then(savedPresets => {
        if (savedPresets) setPresets(savedPresets);
      });

      const removeLogListener = window.electronAPI.onLogUpdate((logData) => {
        setLogs(prev => [...prev, { ...logData, timestamp: new Date().toLocaleTimeString() }]);
      });

      const removeProgressListener = window.electronAPI.onTaskProgress((progressData) => {
        const normalize = (p) => (p || '').replace(/\\/g, '/').toLowerCase();
        setQueue(prevQueue =>
          prevQueue.map(item =>
            item.id === progressData.id || normalize(item.path) === normalize(progressData.path)
              ? { ...item, progress: progressData.progress, currentStep: progressData.step, status: progressData.status || item.status }
              : item
          )
        );
      });

      return () => {
        removeLogListener();
        removeProgressListener();
      };
    }
  }, []);

  // Compute Queue statistics
  const queueStats = {
    queued: queue.filter(q => q.status === 'queued').length,
    running: queue.filter(q => q.status === 'running').length,
    done: queue.filter(q => q.status === 'done').length,
    failed: queue.filter(q => q.status === 'failed').length,
  };

  const handleRunVideo = async (videoId) => {
    const item = queue.find(q => q.id === videoId);
    if (!item) return;

    let videoPath = item.path;

    // If path is missing or just relative filename (e.g. "2.mp4"), trigger file picker fallback
    if (!videoPath || (!videoPath.includes('/') && !videoPath.includes('\\'))) {
      if (window.electronAPI && window.electronAPI.selectFiles) {
        setLogs(prev => [...prev, { type: 'info', text: `Full path missing for '${item.name}'. Please select the video file...` }]);
        const picked = await window.electronAPI.selectFiles();
        if (picked && picked.length > 0) {
          videoPath = picked[0];
          setQueue(prev => prev.map(q => q.id === videoId ? { ...q, path: videoPath, name: videoPath.split(/[\\/]/).pop() } : q));
        } else {
          setQueue(prev => prev.map(q => q.id === videoId ? { ...q, status: 'failed', currentStep: 'File Path Missing' } : q));
          return;
        }
      }
    }

    setQueue(prev => prev.map(q => q.id === videoId ? { ...q, status: 'running', progress: 5, currentStep: 'Initializing Task' } : q));

    const taskPayload = {
      id: item.id,
      videoPath: videoPath,
      targetLanguage: item.targetLang || settings.targetLanguage,
      fullAutoMode,
      settings
    };


    if (window.electronAPI) {
      setLogs(prev => [...prev, { type: 'info', text: `Started dubbing task for: ${item.name}` }]);
      try {
        const res = await window.electronAPI.runPipelineTask(taskPayload);
        if (res.success) {
          setQueue(prev => prev.map(q => q.id === videoId ? { ...q, status: 'done', progress: 100, currentStep: 'Completed' } : q));
          setLogs(prev => [...prev, { type: 'success', text: `Dubbing completed for: ${item.name}` }]);
        } else {
          setQueue(prev => prev.map(q => q.id === videoId ? { ...q, status: 'failed', currentStep: 'Failed' } : q));
          setLogs(prev => [...prev, { type: 'error', text: `Dubbing failed for: ${item.name}` }]);
        }
      } catch (err) {
        setQueue(prev => prev.map(q => q.id === videoId ? { ...q, status: 'failed', currentStep: err.message } : q));
        setLogs(prev => [...prev, { type: 'error', text: `Dubbing exception: ${err.message}` }]);
      }
    } else {
      // Mock execution for browser testing
      setTimeout(() => {
        setQueue(prev => prev.map(q => q.id === videoId ? { ...q, status: 'done', progress: 100, currentStep: 'Completed (Demo)' } : q));
      }, 2000);
    }
  };

  const handleProcessAll = async () => {
    const queuedItems = queue.filter(q => q.status === 'queued' || q.status === 'failed');
    for (const item of queuedItems) {
      await handleRunVideo(item.id);
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} settings={settings} setSettings={setSettings} />
      
      <main className="main-area">
        <Header
          activeTab={activeTab}
          queueStats={queueStats}
          onProcessAll={handleProcessAll}
          fullAutoMode={fullAutoMode}
          setFullAutoMode={setFullAutoMode}
        />

        {activeTab === 'queue' && (
          <QueueView
            queue={queue}
            setQueue={setQueue}
            settings={settings}
            setSettings={setSettings}
            onRunVideo={handleRunVideo}
            fullAutoMode={fullAutoMode}
          />
        )}

        {activeTab === 'presets' && (
          <PresetsView
            presets={presets}
            setPresets={setPresets}
            settings={settings}
            setSettings={setSettings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
          />
        )}

        {activeTab === 'console' && (
          <ConsoleView
            logs={logs}
            setLogs={setLogs}
          />
        )}
      </main>
    </div>
  );
}
