'use client';

import { useState, useEffect } from 'react';
import { getEvents, Event } from '@/lib/api';

interface EventListProps {
  refreshTrigger?: number;
}

export default function EventList({ refreshTrigger = 0 }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    task_id: '',
    event_type: '',
    limit: 100
  });

  useEffect(() => {
    loadEvents();
  }, [refreshTrigger, filter]);

  const loadEvents = async () => {
    try {
      console.log('[EventList] Loading events with filters:', filter);
      setLoading(true);
      setError(null);
      const response = await getEvents({
        limit: filter.limit,
        task_id: filter.task_id || undefined,
        event_type: filter.event_type || undefined,
      });
      console.log(`[EventList] Loaded ${response.events.length} events`);
      setEvents(response.events);
    } catch (err) {
      console.error('[EventList] Error loading events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes('error') || eventType.includes('failed')) {
      return 'text-red-800 bg-red-50 border border-red-300';
    }
    if (eventType.includes('success') || eventType.includes('completed')) {
      return 'text-green-800 bg-green-50 border border-green-300';
    }
    if (eventType.includes('started') || eventType.includes('running')) {
      return 'text-blue-800 bg-blue-50 border border-blue-300';
    }
    return 'text-gray-800 bg-gray-50 border border-gray-300';
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={loadEvents}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Events</h2>
        <button
          onClick={loadEvents}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task ID (partial)
          </label>
          <input
            type="text"
            value={filter.task_id}
            onChange={(e) => setFilter({ ...filter, task_id: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., abc123..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Type
          </label>
          <input
            type="text"
            value={filter.event_type}
            onChange={(e) => setFilter({ ...filter, event_type: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., task_started"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Limit
          </label>
          <select
            value={filter.limit}
            onChange={(e) => setFilter({ ...filter, limit: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
          </select>
        </div>
      </div>

      {/* Event count */}
      <p className="text-sm text-gray-600">
        Showing {events.length} event{events.length !== 1 ? 's' : ''}
      </p>

      {/* Events list */}
      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No events found.
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                      {event.eventType}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {event.taskId && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Task: </span>
                      <span className="font-mono">{event.taskId.substring(0, 12)}...</span>
                    </div>
                  )}

                  {event.data && Object.keys(event.data).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600">
                        View Data
                      </summary>
                      <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-x-auto text-gray-900 border border-gray-200">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

