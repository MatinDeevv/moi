'use client';

import { useState, useEffect } from 'react';

interface FileEntry {
  name: string;
  type: 'file' | 'dir';
}

export default function SandboxPage() {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('[Sandbox] Auto-refreshing directory...');
      loadDirectory(currentPath);
      setLastRefresh(new Date());
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [currentPath, autoRefresh]);

  const loadDirectory = async (path: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/sandbox/list?path=${encodeURIComponent(path)}`);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        // Check for runner not configured
        if (json.error?.includes('Runner URL not configured')) {
          setError('⚙️ Runner not configured. Go to Settings tab and set your runner URL.');
          setEntries([]);
          return;
        }
        throw new Error(json.error || 'Failed to load directory');
      }

      // Ensure entries is always an array
      setEntries(Array.isArray(json.entries) ? json.entries : []);
    } catch (err) {
      console.error('[Sandbox] Load directory error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load directory';

      // Make error messages more user-friendly
      if (errorMsg.includes('Runner URL not configured')) {
        setError('⚙️ Runner not configured. Go to Settings tab and set your runner URL.');
      } else if (errorMsg.includes('invalid JSON')) {
        setError('🔴 Runner returned invalid response. Make sure your runner is running (python runner.py)');
      } else {
        setError(errorMsg);
      }

      // Always set entries to empty array on error
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (path: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/sandbox/read?path=${encodeURIComponent(path)}`);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to read file');
      }

      setFileContent(json.content || '');
      setSelectedFile(path);
    } catch (err) {
      console.error('[Sandbox] Load file error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/sandbox/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content: fileContent }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to save file');
      }

      setSuccess('File saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('[Sandbox] Save file error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const deleteFile = async (path: string) => {
    if (!confirm(`Are you sure you want to delete "${path}"?`)) return;

    try {
      setError(null);

      const res = await fetch('/api/sandbox/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to delete file');
      }

      setSuccess('File deleted successfully');
      setTimeout(() => setSuccess(null), 3000);

      if (selectedFile === path) {
        setSelectedFile(null);
        setFileContent('');
      }

      loadDirectory(currentPath);
    } catch (err) {
      console.error('[Sandbox] Delete file error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const createNewFile = async () => {
    const filename = prompt('Enter filename (e.g., notes.txt or folder/file.md):');
    if (!filename) return;

    const fullPath = currentPath ? `${currentPath}/${filename}` : filename;

    try {
      const res = await fetch('/api/sandbox/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath, content: '' }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to create file');
      }

      setSuccess('File created successfully');
      setTimeout(() => setSuccess(null), 3000);

      loadDirectory(currentPath);
      loadFile(fullPath);
    } catch (err) {
      console.error('[Sandbox] Create file error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create file');
    }
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">📁 Sandbox</h1>
          <p className="text-slate-400 mt-1">Browse and edit files on your runner machine</p>
          <p className="text-xs text-slate-500 mt-1">
            Last refresh: {lastRefresh.toLocaleTimeString()}
            {autoRefresh && <span className="text-green-400 ml-2">● Auto-refreshing</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${
              autoRefresh
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {autoRefresh ? '● Auto-Refresh ON' : '○ Auto-Refresh OFF'}
          </button>
          <button
            onClick={() => loadDirectory(currentPath)}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
          >
            🔄 Refresh Now
          </button>
          <button
            onClick={createNewFile}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
          ➕ New File
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <p className="text-green-300">{success}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Pane: Directory Browser */}
        <div className="col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">Files</h2>
            <button
              onClick={() => loadDirectory(currentPath)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh"
            >
              🔄
            </button>
          </div>

          {/* Current Path */}
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => setCurrentPath('')}
              className="text-blue-400 hover:text-blue-300"
            >
              ~
            </button>
            {currentPath && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-slate-300">{currentPath}</span>
              </>
            )}
          </div>

          {/* Back Button */}
          {currentPath && (
            <button
              onClick={navigateUp}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors flex items-center space-x-2"
            >
              <span>⬆️</span>
              <span>..</span>
            </button>
          )}

          {/* Directory Listing */}
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-slate-400 text-center py-4">Loading...</div>
            ) : error && error.includes('Runner not configured') ? (
              <div className="text-center py-8 space-y-3">
                <div className="text-4xl">⚙️</div>
                <div className="text-slate-400">Runner not configured</div>
                <div className="text-sm text-slate-500">
                  Go to Settings tab and set your runner URL
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-slate-500 text-center py-4">Empty directory</div>
            ) : (
              entries.map((entry, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (entry.type === 'dir') {
                      navigateToFolder(entry.name);
                    } else {
                      const fullPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
                      loadFile(fullPath);
                    }
                  }}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2
                    ${entry.type === 'dir' ? 'text-blue-400 hover:bg-slate-800' : 'text-slate-300 hover:bg-slate-800'}
                    ${selectedFile === (currentPath ? `${currentPath}/${entry.name}` : entry.name) ? 'bg-slate-800' : ''}
                  `}
                >
                  <span>{entry.type === 'dir' ? '📁' : '📄'}</span>
                  <span className="truncate">{entry.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: File Editor */}
        <div className="col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          {selectedFile ? (
            <>
              {/* File Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">📄 {selectedFile.split('/').pop()}</h2>
                  <p className="text-slate-400 text-sm font-mono">{selectedFile}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={saveFile}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : '💾 Save'}
                  </button>
                  <button
                    onClick={() => deleteFile(selectedFile)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* File Content Editor */}
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="w-full h-[600px] bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </>
          ) : (
            <div className="h-[680px] flex items-center justify-center text-slate-500">
              <div className="text-center">
                <p className="text-4xl mb-4">📂</p>
                <p>Select a file to view or edit</p>
                <p className="text-sm mt-2">Or create a new file using the button above</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

