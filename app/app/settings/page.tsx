'use client';

import { useState, useEffect } from 'react';

interface SettingsData {
  runnerUrl: string | null;
  runnerToken: string | null;
  updatedAt: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    runnerUrl: '',
    runnerToken: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/settings/runner');
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to load settings');
      }

      const data = json.data as SettingsData;
      setSettings(data);
      setFormData({
        runnerUrl: data.runnerUrl || '',
        runnerToken: '', // Don't populate token field
      });

      console.log('[Client/Settings] Settings loaded');
    } catch (err) {
      console.error('[Client/Settings] Failed to load settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: any = {};

      // Only include runnerUrl if it's been changed
      if (formData.runnerUrl !== (settings?.runnerUrl || '')) {
        payload.runnerUrl = formData.runnerUrl || null;
      }

      // Only include runnerToken if user typed something
      if (formData.runnerToken.trim() !== '') {
        payload.runnerToken = formData.runnerToken;
      }

      console.log('[Client/Settings] Saving settings:', {
        runnerUrl: payload.runnerUrl || 'unchanged',
        runnerToken: payload.runnerToken ? '***' : 'unchanged',
      });

      const res = await fetch('/api/settings/runner', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to save settings');
      }

      const data = json.data as SettingsData;
      setSettings(data);
      setFormData({
        runnerUrl: data.runnerUrl || '',
        runnerToken: '', // Clear token field after save
      });

      setSuccess('Settings saved successfully!');
      console.log('[Client/Settings] Settings saved');
    } catch (err) {
      console.error('[Client/Settings] Failed to save settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      console.log('[Client/Settings] Testing runner connection');

      const res = await fetch('/api/settings/runner/test');
      const json = await res.json();

      if (json.ok) {
        setTestResult({
          success: true,
          message: 'Runner is online and reachable! ✅'
        });
        console.log('[Client/Settings] Runner test successful');
      } else {
        setTestResult({
          success: false,
          message: json.error || 'Runner is unreachable'
        });
        console.error('[Client/Settings] Runner test failed:', json.error);
      }
    } catch (err) {
      console.error('[Client/Settings] Failed to test runner:', err);
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to test runner'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Settings</h1>
        <p className="text-gray-600">
          Configure your Project ME runner connection. Update your ngrok URL here whenever it changes.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4">
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}

      <div className="bg-[#0f172a] border border-gray-800 rounded-lg shadow-md p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Runner Configuration</h2>

          {/* Runner URL */}
          <div className="space-y-2">
            <label htmlFor="runnerUrl" className="block text-sm font-medium text-gray-700">
              Runner URL
            </label>
            <input
              id="runnerUrl"
              type="text"
              value={formData.runnerUrl}
              onChange={(e) => setFormData({ ...formData, runnerUrl: e.target.value })}
              placeholder="https://your-ngrok-url.ngrok.io"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <p className="text-xs text-gray-500">
              The base URL of your Project ME runner (e.g., ngrok URL). Must start with http:// or https://
            </p>
          </div>

          {/* Runner Token */}
          <div className="space-y-2 mt-4">
            <label htmlFor="runnerToken" className="block text-sm font-medium text-gray-700">
              Runner Token (Optional)
            </label>
            <input
              id="runnerToken"
              type="password"
              value={formData.runnerToken}
              onChange={(e) => setFormData({ ...formData, runnerToken: e.target.value })}
              placeholder={settings?.runnerToken ? 'Token is set (leave empty to keep)' : 'Enter token if required'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <p className="text-xs text-gray-500">
              {settings?.runnerToken
                ? '✅ Token is currently set. Leave empty to keep existing token, or enter a new one to update.'
                : 'Authentication token for the runner (if required)'}
            </p>
          </div>

          {/* Last Updated */}
          {settings?.updatedAt && (
            <div className="mt-4 text-sm text-gray-600">
              Last updated: {new Date(settings.updatedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium transition-colors shadow-md"
          >
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>

          <button
            onClick={handleTest}
            disabled={testing || !formData.runnerUrl}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors shadow-md"
          >
            {testing ? 'Testing...' : '🔌 Test Runner'}
          </button>

          <button
            onClick={loadSettings}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors shadow-md"
          >
            🔄 Reload
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <p className={`font-medium ${
              testResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {testResult.success ? '✅ Success' : '❌ Failed'}
            </p>
            <p className={`text-sm mt-1 ${
              testResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResult.message}
            </p>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 How it works</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Set your runner URL here (e.g., from ngrok) instead of environment variables</li>
          <li>No redeployment needed when your ngrok URL changes</li>
          <li>Use the "Test Runner" button to verify connectivity before running tasks</li>
          <li>Token is optional - only needed if your runner requires authentication</li>
          <li>Settings are stored in the database and persist across deployments</li>
        </ul>
      </div>
    </div>
  );
}

