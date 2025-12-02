'use client';

import { useState, useRef, useEffect } from 'react';

interface HistoryEntry {
  command: string;
  output: string;
  exitCode: number;
  timestamp: string;
}

export default function ShellPage() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const runCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || loading) return;

    const cmd = command.trim();
    setCommand('');
    setLoading(true);

    try {
      const res = await fetch('/api/shell/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      const json = await res.json();

      const entry: HistoryEntry = {
        command: cmd,
        output: json.ok ? (json.output || '') : (json.error || 'Command failed'),
        exitCode: json.exitCode ?? (json.ok ? 0 : 1),
        timestamp: new Date().toISOString(),
      };

      setHistory(prev => [...prev, entry]);
    } catch (err) {
      const entry: HistoryEntry = {
        command: cmd,
        output: err instanceof Error ? err.message : 'Network error',
        exitCode: 1,
        timestamp: new Date().toISOString(),
      };
      setHistory(prev => [...prev, entry]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">⚡ Shell</h1>
        <p className="text-gray-400 mt-1">Execute commands on your runner machine</p>
      </div>

      {/* Terminal */}
      <div className="bg-[#020617] border border-gray-800 rounded-xl overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-[#0b1120] border-b border-gray-800 px-4 py-2 flex items-center space-x-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs text-gray-500 ml-4">Shell</span>
        </div>

        {/* Terminal Output */}
        <div
          ref={outputRef}
          className="p-4 h-[500px] overflow-y-auto font-mono text-sm"
        >
          {history.length === 0 ? (
            <div className="text-gray-600">
              <p>Project ME Shell</p>
              <p className="mt-2">Type commands to execute on your runner machine.</p>
              <p className="mt-1">Examples: ls, pwd, python script.py</p>
            </div>
          ) : (
            history.map((entry, idx) => (
              <div key={idx} className="mb-4">
                {/* Command */}
                <div className="flex items-start space-x-2">
                  <span className="text-indigo-400">$</span>
                  <span className="text-gray-200">{entry.command}</span>
                </div>

                {/* Output */}
                {entry.output && (
                  <div className={`mt-1 pl-4 ${entry.exitCode !== 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    <pre className="whitespace-pre-wrap">{entry.output}</pre>
                  </div>
                )}

                {/* Exit Code (if failed) */}
                {entry.exitCode !== 0 && (
                  <div className="mt-1 pl-4 text-xs text-red-500">
                    Exit code: {entry.exitCode}
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="text-gray-500 animate-pulse">Running...</div>
          )}
        </div>

        {/* Terminal Input */}
        <form onSubmit={runCommand} className="border-t border-gray-800 bg-[#0b1120] p-4">
          <div className="flex items-center space-x-2">
            <span className="text-indigo-400 font-mono">$</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter command... (e.g., ls, pwd, python script.py)"
              disabled={loading}
              className="flex-1 bg-transparent border-none outline-none text-gray-200 font-mono text-sm placeholder-gray-600"
              autoFocus
            />
          </div>
        </form>
      </div>

      {/* Help */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold text-gray-100 mb-3">📘 Help</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <p>• Commands execute in the sandbox directory on your runner</p>
          <p>• Use <code className="bg-gray-800 px-2 py-1 rounded text-gray-300">pwd</code> to see current directory</p>
          <p>• Use <code className="bg-gray-800 px-2 py-1 rounded text-gray-300">ls</code> to list files</p>
          <p>• Python scripts can be run with <code className="bg-gray-800 px-2 py-1 rounded text-gray-300">python script.py</code></p>
        </div>
      </div>
    </div>
  );
}

