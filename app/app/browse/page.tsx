mixed with the prombt'use client';

import { useState, useEffect } from 'react';

interface FileEntry {
  name: string;
  type: 'file' | 'dir' | 'drive';
  path?: string;
  size?: number;
  relative?: string;
}

interface AnalysisResult {
  ok: boolean;
  analysis?: string;
  files_analyzed?: string[];
  error?: string;
}

export default function BrowsePage() {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pattern, setPattern] = useState('');
  const [recursive, setRecursive] = useState(false);

  // Code Analysis
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    loadDirectory(currentPath);
  }, []);

  const loadDirectory = async (path: string, opts?: { pattern?: string; recursive?: boolean }) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (path) params.set('path', path);
      if (opts?.pattern || pattern) params.set('pattern', opts?.pattern || pattern);
      if (opts?.recursive ?? recursive) params.set('recursive', 'true');

      const res = await fetch(`/api/browse?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to load directory');
      }

      setEntries(Array.isArray(json.entries) ? json.entries : []);
      setCurrentPath(json.path || path);
    } catch (err) {
      console.error('[Browse] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load directory');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (path: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/browse/read?path=${encodeURIComponent(path)}`);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to read file');
      }

      setFileContent(json.content || '');
      setSelectedFile({ name: json.name, type: 'file', path, size: json.size });
    } catch (err) {
      console.error('[Browse] Read error:', err);
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setLoading(false);
    }
  };

  const handleEntryClick = (entry: FileEntry) => {
    if (entry.type === 'dir' || entry.type === 'drive') {
      const newPath = entry.path || entry.name;
      setCurrentPath(newPath);
      loadDirectory(newPath);
      setSelectedFile(null);
      setFileContent('');
    } else if (entry.type === 'file') {
      const filePath = entry.path || `${currentPath}/${entry.name}`;
      loadFile(filePath);
    }
  };

  const toggleFileSelection = (path: string) => {
    setSelectedFiles(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const analyzeFiles = async () => {
    if (selectedFiles.length === 0 || !analysisPrompt) return;

    try {
      setAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: selectedFiles,
          prompt: analysisPrompt,
          include_content: true
        })
      });

      const json = await res.json();
      setAnalysisResult(json);

      if (!json.ok) {
        throw new Error(json.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('[Browse] Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const goUp = () => {
    // Find parent directory
    const parentEntry = entries.find(e => e.name === '..');
    if (parentEntry?.path) {
      setCurrentPath(parentEntry.path);
      loadDirectory(parentEntry.path);
    } else if (currentPath) {
      // Go to root (drives list)
      setCurrentPath('');
      loadDirectory('');
    }
  };

  const getFileIcon = (entry: FileEntry) => {
    if (entry.type === 'drive') return '💿';
    if (entry.type === 'dir') return entry.name === '..' ? '⬆️' : '📁';

    const ext = entry.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return '🐍';
      case 'ts': case 'tsx': return '📘';
      case 'js': case 'jsx': return '📒';
      case 'json': return '📋';
      case 'md': return '📝';
      case 'txt': return '📄';
      case 'css': return '🎨';
      case 'html': return '🌐';
      default: return '📄';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">System File Browser</h1>
          <p className="text-gray-400 mt-1">Browse and analyze files from anywhere on the system</p>
        </div>
      </div>

      {/* Path Bar */}
      <div className="bg-[#0f172a] rounded-lg border border-gray-800 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={goUp}
            disabled={!currentPath}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⬆️ Up
          </button>
          <div className="flex-1 font-mono text-sm bg-gray-900 rounded-lg px-4 py-2 border border-gray-700">
            {currentPath || '(Drives)'}
          </div>
          <button
            onClick={() => loadDirectory(currentPath)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Filter pattern (e.g., *.py)"
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={recursive}
              onChange={(e) => setRecursive(e.target.checked)}
              className="rounded bg-gray-800 border-gray-600"
            />
            Recursive
          </label>
          <button
            onClick={() => loadDirectory(currentPath, { pattern, recursive })}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 rounded-lg p-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File List */}
        <div className="bg-[#0f172a] rounded-lg border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold text-gray-100">Files</h2>
            <p className="text-sm text-gray-500 mt-1">
              {entries.filter(e => e.name !== '..').length} items
              {selectedFiles.length > 0 && ` • ${selectedFiles.length} selected`}
            </p>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {loading && entries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No files found</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {entries.map((entry, idx) => (
                  <div
                    key={`${entry.name}-${idx}`}
                    className={`flex items-center gap-3 p-3 hover:bg-gray-800/50 cursor-pointer ${
                      selectedFile?.path === entry.path ? 'bg-indigo-900/30' : ''
                    }`}
                  >
                    {entry.type === 'file' && entry.path && (
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(entry.path)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleFileSelection(entry.path!);
                        }}
                        className="rounded bg-gray-800 border-gray-600"
                      />
                    )}
                    <div
                      className="flex-1 flex items-center gap-3"
                      onClick={() => handleEntryClick(entry)}
                    >
                      <span className="text-xl">{getFileIcon(entry)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-200 truncate">{entry.name}</div>
                        {entry.size !== undefined && (
                          <div className="text-xs text-gray-500">{formatSize(entry.size)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* File Viewer / Analysis */}
        <div className="space-y-6">
          {/* File Content Viewer */}
          {selectedFile && (
            <div className="bg-[#0f172a] rounded-lg border border-gray-800">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-100">{selectedFile.name}</h2>
                  <p className="text-sm text-gray-500">{formatSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFileContent('');
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 max-h-[300px] overflow-auto">
                <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                  {fileContent}
                </pre>
              </div>
            </div>
          )}

          {/* Code Analysis Panel */}
          <div className="bg-[#0f172a] rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-semibold text-gray-100">🤖 Code Analysis</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select files and ask the LLM to analyze them
              </p>
            </div>
            <div className="p-4 space-y-4">
              {selectedFiles.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-2">Selected files:</div>
                  <div className="space-y-1">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-indigo-400">•</span>
                        <span className="text-gray-300 truncate">{file}</span>
                        <button
                          onClick={() => toggleFileSelection(file)}
                          className="text-gray-500 hover:text-red-400 ml-auto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={analysisPrompt}
                onChange={(e) => setAnalysisPrompt(e.target.value)}
                placeholder="What would you like to analyze? (e.g., 'Find bugs in this code', 'Explain what this does', 'Suggest improvements')"
                className="w-full h-24 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />

              <button
                onClick={analyzeFiles}
                disabled={selectedFiles.length === 0 || !analysisPrompt || analyzing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {analyzing ? '🔄 Analyzing...' : `🔍 Analyze ${selectedFiles.length} file(s)`}
              </button>

              {analysisResult && (
                <div className={`rounded-lg p-4 ${analysisResult.ok ? 'bg-gray-800/50' : 'bg-red-900/30'}`}>
                  {analysisResult.ok ? (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">
                        Analyzed {analysisResult.files_analyzed?.length || 0} files:
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-gray-300 text-sm">
                          {analysisResult.analysis}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-300">{analysisResult.error}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

