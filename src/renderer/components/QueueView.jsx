import React, { useState, useRef } from 'react';
import { UploadCloud, FolderPlus, Link2, Film, Trash2, Settings2, Sparkles, Volume2, Languages, Check, RefreshCw, Play, Type, MicOff, Crop, SlidersHorizontal, Eye, User, Folder, Plus, FileText } from 'lucide-react';

export const COMPREHENSIVE_LANGUAGES = [
  "Auto-Detect",
  "English",
  "Urdu",
  "Hindi",
  "Arabic",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Russian",
  "Turkish",
  "Indonesian",
  "Chinese (Mandarin)",
  "Japanese",
  "Korean",
  "Italian",
  "Dutch",
  "Polish",
  "Swedish",
  "Ukrainian",
  "Vietnamese",
  "Thai",
  "Bengali",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Persian (Farsi)",
  "Swahili",
  "Tagalog (Filipino)",
  "Romanian",
  "Czech",
  "Greek",
  "Hungarian",
  "Danish",
  "Finnish",
  "Norwegian",
  "Hebrew",
  "Malay",
  "Slovak",
  "Bulgarian",
  "Croatian",
  "Serbian",
  "Kannada",
  "Malayalam"
];

export default function QueueView({
  queue,
  setQueue,
  settings,
  setSettings,
  onRunVideo,
  fullAutoMode,
  setFullAutoMode
}) {
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [folderInfo, setFolderInfo] = useState(null); // { folderPath, videoFiles }

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Drag and Drop handlers using Electron 34 webUtils.getPathForFile
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const validExts = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];
    const videoFiles = files.filter(f => validExts.some(ext => f.name.toLowerCase().endsWith(ext)));

    if (videoFiles.length > 0) {
      const paths = videoFiles.map(f => {
        if (window.electronAPI && window.electronAPI.getFilePath) {
          return window.electronAPI.getFilePath(f);
        }
        return f.path || f.name;
      });

      addFilesToQueue(paths);
    }
  };

  // Add files to queue and AUTO-START processing immediately
  const addFilesToQueue = async (filePaths) => {
    const newItems = filePaths.map(filePath => ({
      id: Math.random().toString(36).substring(2, 9),
      path: filePath,
      name: filePath.split(/[\\/]/).pop(),
      status: 'queued',
      progress: 0,
      currentStep: 'Queued',
      targetLang: settings.targetLanguage || 'Spanish',
      createdAt: new Date().toLocaleTimeString()
    }));
    
    setQueue(prev => [...prev, ...newItems]);

    // Query containing folder contents for single file or file list import (Bug 3 / Feature)
    if (filePaths.length > 0 && window.electronAPI && window.electronAPI.getFolderContents) {
      try {
        const folderData = await window.electronAPI.getFolderContents(filePaths[0]);
        if (folderData && folderData.videoFiles) {
          setFolderInfo(folderData);
        }
      } catch (err) {
        console.error('Failed to fetch containing folder contents:', err);
      }
    }

    // Auto-start video pipeline right away!
    setTimeout(() => {
      newItems.forEach(item => {
        onRunVideo(item.id);
      });
    }, 150);
  };

  const handleImportFiles = async () => {
    if (window.electronAPI) {
      const files = await window.electronAPI.selectFiles();
      if (files && files.length > 0) {
        addFilesToQueue(files);
        return;
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportFolder = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.selectFolder();
      if (res && res.videoFiles && res.videoFiles.length > 0) {
        setFolderInfo(res);
        addFilesToQueue(res.videoFiles);
        return;
      }
    }
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const paths = files.map(f => {
        if (window.electronAPI && window.electronAPI.getFilePath) {
          return window.electronAPI.getFilePath(f);
        }
        return f.name;
      });
      addFilesToQueue(paths);
    }
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    setIsFetchingUrl(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.downloadVideoLink(urlInput.trim());
        if (result && result.filePath) {
          addFilesToQueue([result.filePath]);
          setUrlInput('');
        }
      } else {
        setTimeout(() => {
          addFilesToQueue([`Downloaded_Video_${Date.now()}.mp4`]);
          setUrlInput('');
          setIsFetchingUrl(false);
        }, 1500);
        return;
      }
    } catch (err) {
      alert('Failed to download video link: ' + err.message);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handlePlayOutputVideo = async (item) => {
    const defaultDFolder = "D:\\Dubbed Craft AI";
    const exportFolder = settings.exportFolder || defaultDFolder;
    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const targetLang = item.targetLang || settings.targetLanguage || 'Spanish';
    const expectedPath = `${exportFolder}\\${baseName}_dubbed_${targetLang}.mp4`;

    if (window.electronAPI && window.electronAPI.openFile) {
      const opened = await window.electronAPI.openFile(expectedPath);
      if (!opened) {
        alert(`Dubbed Video Saved At:\n${expectedPath}`);
      }
    } else {
      alert(`Playing Dubbed Video:\n${expectedPath}`);
    }
  };

  const removeItem = (id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const clearDone = () => {
    setQueue(prev => prev.filter(item => item.status !== 'done'));
  };

  // Caption style preset definitions (Matching CapCut Text Models)
  const captionPresets = [
    { id: 'teal_karaoke', label: 'Teal Karaoke Box' },
    { id: 'classic_white', label: 'Classic White' },
    { id: 'yellow_stroke', label: 'Yellow Stroke' },
    { id: 'white_box', label: 'White Black Box' },
    { id: 'bold_caps_box', label: 'Bold Caps Dark' }
  ];

  // Dynamic 5 Caption Presets Live Preview Widget renderer
  const renderCaptionPreview = () => {
    const currentPreset = settings.captionStyle || 'teal_karaoke';
    
    let mainStyle = { fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.45rem', transition: 'all 0.3s ease' };
    let wordLook = { color: '#FFFFFF' };
    let wordAt = { color: '#06B6D4' };
    let wordThis = { color: '#FFFFFF' };
    let containerBg = '#0B0C10';

    if (currentPreset === 'teal_karaoke') {
      containerBg = 'rgba(0,0,0,0.85)';
      wordLook = { color: '#FFFFFF', background: '#00D9B3', padding: '3px 8px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,217,179,0.4)' };
      wordAt = { color: '#FFFF00', background: '#00D9B3', padding: '3px 8px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,217,179,0.5)', transform: 'scale(1.15)', display: 'inline-block' };
      wordThis = { color: '#FFFFFF', background: '#00D9B3', padding: '3px 8px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,217,179,0.4)' };
    } else if (currentPreset === 'classic_white') {
      wordLook = { color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.8)' };
      wordAt = { color: '#FACC15', textShadow: '0 2px 4px rgba(0,0,0,0.8)', transform: 'scale(1.18)', display: 'inline-block' };
      wordThis = { color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.8)' };
    } else if (currentPreset === 'yellow_stroke') {
      wordLook = { color: '#FACC15', WebkitTextStroke: '1px #000000', textShadow: '2px 2px 0 #000' };
      wordAt = { color: '#FFFFFF', WebkitTextStroke: '1px #000000', textShadow: '2px 2px 0 #000', transform: 'scale(1.18)', display: 'inline-block' };
      wordThis = { color: '#FACC15', WebkitTextStroke: '1px #000000', textShadow: '2px 2px 0 #000' };
    } else if (currentPreset === 'white_box') {
      containerBg = 'rgba(0, 0, 0, 0.95)';
      wordLook = { color: '#FFFFFF', background: '#000000', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' };
      wordAt = { color: '#FACC15', background: '#000000', padding: '3px 8px', borderRadius: '4px', border: '1px solid #FACC15', transform: 'scale(1.1)', display: 'inline-block' };
      wordThis = { color: '#FFFFFF', background: '#000000', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' };
    } else if (currentPreset === 'bold_caps_box') {
      containerBg = 'rgba(17,17,17,0.95)';
      wordLook = { color: '#FFFFFF', background: 'rgba(30,30,30,0.8)', padding: '3px 8px', borderRadius: '4px' };
      wordAt = { color: '#FACC15', background: 'rgba(30,30,30,0.9)', padding: '3px 8px', borderRadius: '4px', transform: 'scale(1.15)', display: 'inline-block' };
      wordThis = { color: '#FFFFFF', background: 'rgba(30,30,30,0.8)', padding: '3px 8px', borderRadius: '4px' };
    }

    return (
      <div style={{ padding: '1rem 0.85rem', background: containerBg, borderRadius: '10px', textAlign: 'center', border: '1px dashed rgba(255,107,0,0.4)', marginTop: '0.2rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          LIVE CAPTION PREVIEW ({currentPreset.toUpperCase()})
        </div>
        <div style={mainStyle}>
          <span style={wordLook}>LOOK</span>
          <span style={wordAt}>AT</span>
          <span style={wordThis}>THIS</span>
        </div>
      </div>
    );
  };

  return (
    <div className="view-container" style={{ padding: '1.25rem' }}>
      {/* Hidden File Inputs for Web Fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept="video/mp4,video/quicktime,video/x-matroska,video/avi,video/webm"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFileInputChange}
        webkitdirectory="true"
        directory="true"
        multiple
        style={{ display: 'none' }}
      />

      {/* Main 2-Column Split Layout: Left (Queue & Imports) | Right (Vertical Video Settings) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 430px', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Import Zone + URL Fetcher + Queued Videos Table + Containing Folder Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Import Dropzone & URL Input */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem' }}>
            <div
              className={`glass-panel ${dragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleImportFiles}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justify: 'center',
                padding: '1.5rem 1rem',
                border: dragOver ? '2px dashed #FF6B00' : '2px dashed var(--border-color)',
                background: dragOver ? 'rgba(255,107,0,0.1)' : 'var(--bg-card)',
                borderRadius: '14px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,107,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B00', marginBottom: '0.5rem' }}>
                <UploadCloud size={24} />
              </div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                Drag & Drop Video Files or Folders Here
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                Auto-starts pipeline on upload (MP4, MOV, MKV)
              </p>

              <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-secondary" onClick={handleImportFiles} style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem' }}>
                  <Film size={14} /> Import Files
                </button>
                <button className="btn btn-secondary" onClick={handleImportFolder} style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem' }}>
                  <FolderPlus size={14} /> Import Folder
                </button>
              </div>
            </div>

            {/* Link Fetcher */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Link2 size={16} color="#FF6B00" /> Paste Video Link
                </h4>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="YouTube / TikTok URL..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '0.5rem' }}
                  />
                  <button 
                    className="btn" 
                    onClick={handleFetchUrl} 
                    disabled={isFetchingUrl || !urlInput.trim()}
                    style={{ padding: '0.5rem 0.85rem', background: '#FF6B00', color: 'white', fontWeight: 700 }}
                  >
                    {isFetchingUrl ? <RefreshCw size={14} className="spin" /> : 'Fetch'}
                  </button>
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Voiceover</span>
                  <span className="status-badge status-done" style={{ fontSize: '0.7rem', background: 'rgba(255,107,0,0.2)', color: '#FF9D42' }}>
                    {settings.targetLanguage || 'Spanish'} ({settings.voiceGender || 'Male'})
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Default Saving Path: <strong style={{ color: '#FF9D42' }}>D:\Dubbed Craft AI</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Main Queue Table */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Queued Videos ({queue.length})
                <span style={{ fontSize: '0.7rem', color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                  Auto-Start Active
                </span>
              </h3>

              {queue.some(item => item.status === 'done') && (
                <button className="btn btn-secondary" onClick={clearDone} style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                  Clear Completed
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Film size={32} color="var(--border-color-glow)" style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                <p style={{ fontSize: '0.85rem' }}>No videos in queue. Drag & drop video files above to auto-process.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Video File</th>
                    <th>Target Lang</th>
                    <th>Status</th>
                    <th>Step Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Film size={15} color="#FF6B00" />
                          <span title={item.path}>{item.name}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', fontSize: '0.78rem', fontWeight: 600 }}>
                          {item.targetLang}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${item.status}`} style={{ fontSize: '0.7rem' }}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ minWidth: '140px' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.currentStep}</span>
                            <span>{item.progress}%</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${item.progress}%`,
                                height: '100%',
                                background: item.status === 'failed' ? 'var(--accent-danger)' : 'linear-gradient(90deg, #FF6B00, #FACC15)',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          {item.status === 'done' ? (
                            <button
                              className="btn"
                              style={{ background: '#10B981', color: 'white', padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.25rem', fontWeight: 700 }}
                              onClick={() => handlePlayOutputVideo(item)}
                            >
                              <Play size={12} fill="white" /> Play Result
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              onClick={() => onRunVideo(item.id)}
                              disabled={item.status === 'running'}
                            >
                              {item.status === 'running' ? <RefreshCw size={12} className="spin" /> : 'Process'}
                            </button>
                          )}
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', color: 'var(--accent-danger)' }}
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* BUG 3 / FEATURE: Available Videos in Containing Folder */}
          {folderInfo && folderInfo.videoFiles && folderInfo.videoFiles.length > 0 && (
            <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFFFFF' }}>
                  <Folder size={16} color="#FF6B00" /> Files Available in Containing Folder
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    ({folderInfo.folderPath})
                  </span>
                </h4>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  onClick={() => {
                    const unadded = folderInfo.videoFiles.filter(p => !queue.some(q => q.path === p));
                    if (unadded.length > 0) addFilesToQueue(unadded);
                  }}
                >
                  <Plus size={13} /> Add All ({folderInfo.videoFiles.length})
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
                {folderInfo.videoFiles.map((filePath, idx) => {
                  const fileName = filePath.split(/[\\/]/).pop();
                  const isAlreadyInQueue = queue.some(q => q.path === filePath);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '0.4rem 0.65rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '6px',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <Film size={13} color="var(--text-muted)" />
                        <span title={filePath} style={{ color: isAlreadyInQueue ? '#FF9D42' : 'var(--text-secondary)' }}>
                          {fileName}
                        </span>
                      </div>

                      {isAlreadyInQueue ? (
                        <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>Added</span>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                          onClick={() => addFilesToQueue([filePath])}
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Vertical Video Settings Drawer Panel (Matching Screenshots 1, 2, 3, 4 Exactly) */}
        <div 
          className="glass-panel" 
          style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem',
            maxHeight: 'calc(100vh - 110px)',
            overflowY: 'auto',
            border: '1px solid rgba(255,107,0,0.25)',
            background: 'rgba(18, 19, 26, 0.95)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Video settings
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Squishy dumpling unboxing...</span>
          </div>

          {/* Card 1: Upload as-is */}
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.9rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>Upload as-is (no editing)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Skip all editing: no rewrite, voiceover, captions or crop.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.uploadAsIs || false}
              onChange={(e) => setSettings({ ...settings, uploadAsIs: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: '#FF6B00' }}
            />
          </label>

          {/* Card 2: Full Auto Mode */}
          <div style={{ padding: '0.85rem', background: 'rgba(255,107,0,0.08)', borderRadius: '12px', border: '1px solid rgba(255,107,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={15} color="#FF6B00" /> Full Auto mode
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Voice removal, rewrite, TTS and captions
              </div>
            </div>
            <button 
              className="btn"
              onClick={() => setFullAutoMode && setFullAutoMode(!fullAutoMode)}
              style={{
                background: fullAutoMode ? '#FF6B00' : 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.4rem 0.85rem',
                borderRadius: '8px'
              }}
            >
              {fullAutoMode ? 'Enabled' : 'Enable'}
            </button>
          </div>

          {/* Card 3: Original audio (Matching Screenshot 3!) */}
          <div style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Volume2 size={15} color="#FF6B00" /> Original audio
            </div>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Remove original voice</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fast vocal suppression, keeps the backing audio</div>
              </div>
              <input
                type="checkbox"
                checked={settings.removeVoice ?? true}
                onChange={(e) => setSettings({ ...settings, removeVoice: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#FF6B00' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>High-quality AI separation</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Much cleaner, but slow — fails back automatically if it stalls</div>
              </div>
              <input
                type="checkbox"
                checked={settings.hqDemucs ?? true}
                onChange={(e) => setSettings({ ...settings, hqDemucs: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#FF6B00' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Keep ambient & ASMR sound</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sizzles, chopping, music — turn off to mute the source entirely</div>
              </div>
              <input
                type="checkbox"
                checked={settings.keepAmbient ?? true}
                onChange={(e) => setSettings({ ...settings, keepAmbient: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#FF6B00' }}
              />
            </label>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ambient level</span>
                <span style={{ color: '#FF6B00', fontWeight: 700 }}>{settings.ambientLevel ?? 68}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.ambientLevel ?? 68}
                onChange={(e) => setSettings({ ...settings, ambientLevel: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#FF6B00' }}
              />
            </div>
          </div>

          {/* Card 4: Transcript & script (Matching Screenshot 3!) */}
          <div style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Languages size={15} color="#FF6B00" /> Transcript & script
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Spoken language</label>
              <select
                className="input-field"
                value={settings.spokenLang || 'Auto-Detect'}
                onChange={(e) => setSettings({ ...settings, spokenLang: e.target.value })}
                style={{ fontSize: '0.8rem', padding: '0.45rem' }}
              >
                {COMPREHENSIVE_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Transcription accuracy</label>
              <select
                className="input-field"
                value={settings.whisperAccuracy || 'Balanced'}
                onChange={(e) => setSettings({ ...settings, whisperAccuracy: e.target.value })}
                style={{ fontSize: '0.8rem', padding: '0.45rem' }}
              >
                <option value="Fast">Fast (tiny)</option>
                <option value="Balanced">Balanced (base)</option>
                <option value="High Quality">High Quality (large-v3)</option>
              </select>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Bigger models hear more, but take longer and use more memory
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Script & voiceover language</label>
              <select
                className="input-field"
                value={settings.targetLanguage || 'Spanish'}
                onChange={(e) => setSettings({ ...settings, targetLanguage: e.target.value })}
                style={{ fontSize: '0.8rem', padding: '0.45rem' }}
              >
                <option value="Same as the video">Same as the video</option>
                {COMPREHENSIVE_LANGUAGES.filter(l => l !== 'Auto-Detect').map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 5: AI script rewrite (Matching Screenshot 1!) */}
          <div style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileText size={15} color="#FF6B00" /> AI script rewrite
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Claude Haiku / Sonnet API</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableAiRewrite || false}
                onChange={(e) => setSettings({ ...settings, enableAiRewrite: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#FF6B00', cursor: 'pointer' }}
              />
            </div>

            {settings.enableAiRewrite && (
              <>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Tone</label>
                  <select
                    className="input-field"
                    value={settings.rewriteTone || 'Engaging & Smooth'}
                    onChange={(e) => setSettings({ ...settings, rewriteTone: e.target.value })}
                    style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                  >
                    <option value="Engaging & Smooth">Engaging & smooth</option>
                    <option value="Professional">Professional & Formal</option>
                    <option value="Casual">Casual & Conversational</option>
                    <option value="Humorous">Humorous & Funny</option>
                    <option value="Dramatic">Dramatic & Energetic</option>
                    <option value="Educational">Educational & Clear</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Custom instructions</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="e.g. Open with a strong hook, end with a call to action..."
                    value={settings.customPrompt || ''}
                    onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                    style={{ fontSize: '0.78rem', padding: '0.5rem', resize: 'vertical' }}
                  />
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Optional</div>
                </div>
              </>
            )}
          </div>

          {/* Card 6: AI voiceover (Matching Screenshot 2!) */}
          <div style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Volume2 size={15} color="#FF6B00" /> AI voiceover
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Generate neural voice (Microsoft Edge / ElevenLabs)</div>
              </div>
              <input
                type="checkbox"
                checked={settings.generateNeuralVoice ?? true}
                onChange={(e) => setSettings({ ...settings, generateNeuralVoice: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#FF6B00', cursor: 'pointer' }}
              />
            </div>

            {settings.generateNeuralVoice !== false && (
              <>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Voice</label>
                  <select
                    className="input-field"
                    value={settings.voiceSelection || 'Jenny — English (US, female)'}
                    onChange={(e) => setSettings({ ...settings, voiceSelection: e.target.value })}
                    style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                  >
                    <option value="Jenny — English (US, female)">Jenny — English (US, female)</option>
                    <option value="Christopher — English (US, male)">Christopher — English (US, male)</option>
                    <option value="Asad — Urdu (PK, male)">Asad — Urdu (PK, male)</option>
                    <option value="Uzma — Urdu (PK, female)">Uzma — Urdu (PK, female)</option>
                    <option value="Madhur — Hindi (IN, male)">Madhur — Hindi (IN, male)</option>
                    <option value="Swara — Hindi (IN, female)">Swara — Hindi (IN, female)</option>
                    <option value="Alvaro — Spanish (ES, male)">Alvaro — Spanish (ES, male)</option>
                    <option value="Elvira — Spanish (ES, female)">Elvira — Spanish (ES, female)</option>
                    <option value="Henri — French (FR, male)">Henri — French (FR, male)</option>
                    <option value="Denise — French (FR, female)">Denise — French (FR, female)</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Speaking speed</span>
                    <span style={{ color: '#FF6B00', fontWeight: 700 }}>{(settings.speakingSpeed || 1.0).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.50"
                    max="2.00"
                    step="0.05"
                    value={settings.speakingSpeed || 1.0}
                    onChange={(e) => setSettings({ ...settings, speakingSpeed: parseFloat(e.target.value) })}
                    style={{ width: '100%', accentColor: '#FF6B00' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>Duck music under voice</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Lowers the music while narration plays</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.duckMusic ?? true}
                    onChange={(e) => setSettings({ ...settings, duckMusic: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#FF6B00' }}
                  />
                </label>
              </>
            )}
          </div>

          {/* Card 7: Captions */}
          <div style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Type size={15} color="#FF6B00" /> Captions
            </div>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Burn captions into video</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Permanently rendered subtitles in target language</div>
              </div>
              <input
                type="checkbox"
                checked={settings.burnCaptions ?? true}
                onChange={(e) => setSettings({ ...settings, burnCaptions: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#FF6B00' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Karaoke word highlight</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Highlights each word as it is spoken</div>
              </div>
              <input
                type="checkbox"
                checked={settings.karaokeHighlight ?? true}
                onChange={(e) => setSettings({ ...settings, karaokeHighlight: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#FF6B00' }}
              />
            </label>

            {/* Sliders for Font size & Vertical Position */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Font size</span>
                <span style={{ color: '#FF6B00', fontWeight: 700 }}>{settings.fontSize || 48}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="72"
                value={settings.fontSize || 48}
                onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#FF6B00' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vertical position</span>
                <span style={{ color: '#FF6B00', fontWeight: 700 }}>{settings.verticalPosition || 78}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={settings.verticalPosition || 78}
                onChange={(e) => setSettings({ ...settings, verticalPosition: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#FF6B00' }}
              />
            </div>

            {/* 5 Distinct Style Presets Grid */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Style Preset</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                {captionPresets.map((preset) => (
                  <button
                    key={preset.id}
                    className="btn"
                    onClick={() => setSettings({ ...settings, captionStyle: preset.id })}
                    style={{
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.75rem',
                      background: (settings.captionStyle || 'Hormozi Bold') === preset.id ? '#FF6B00' : 'rgba(255,255,255,0.06)',
                      color: 'white',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontWeight: 700
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE DYNAMIC PREVIEW BOX (Showing 5 distinct visual styles!) */}
            {renderCaptionPreview()}

            {/* Backdrop behind captions */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Backdrop behind captions</div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {['None', 'Soft', 'Black', 'Blur'].map((opt) => (
                  <button
                    key={opt}
                    className="btn"
                    onClick={() => setSettings({ ...settings, backdrop: opt })}
                    style={{
                      flex: 1,
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.72rem',
                      background: (settings.backdrop || 'Black') === opt ? '#FF6B00' : 'rgba(255,255,255,0.06)',
                      color: 'white',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Draws a black band sized to your caption, hiding whatever is behind it.
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>Only when needed</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Applied only to videos with captions burned in</div>
              </div>
              <input
                type="checkbox"
                checked={settings.onlyWhenNeeded ?? true}
                onChange={(e) => setSettings({ ...settings, onlyWhenNeeded: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#FF6B00' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>Also blur the source's own captions</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Detects and blurs original burned-in text</div>
              </div>
              <input
                type="checkbox"
                checked={settings.blurSourceCaptions || false}
                onChange={(e) => setSettings({ ...settings, blurSourceCaptions: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#FF6B00' }}
              />
            </label>
          </div>

          {/* Card 8: Framing */}
          <div style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Crop size={15} color="#FF6B00" /> Framing
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aspect ratio</div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {['Original', '16:9', '9:16', '1:1'].map((ratio) => (
                <button
                  key={ratio}
                  className="btn"
                  onClick={() => setSettings({ ...settings, aspectRatio: ratio })}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.75rem',
                    background: (settings.aspectRatio || 'Original') === ratio ? '#10B981' : 'rgba(255,255,255,0.06)',
                    color: 'white',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Card 9: Mute clips with no speech */}
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.9rem', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>Mute clips with no speech</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Detects quiet pauses and mutes sound
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.muteNoSpeech ?? true}
              onChange={(e) => setSettings({ ...settings, muteNoSpeech: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: '#FF6B00' }}
            />
          </label>

        </div>
      </div>
    </div>
  );
}
