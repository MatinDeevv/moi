"""
Memory and event logging for Project ME v0
All system events are logged to JSONL for persistence and debugging.
"""
import json
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Any
from enum import Enum

from . import config


class EventType(Enum):
    TASK_STARTED = "task_started"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    TOOL_CALLED = "tool_called"
    TOOL_RESULT = "tool_result"
    LLM_REQUEST = "llm_request"
    LLM_RESPONSE = "llm_response"
    ERROR = "error"
    INFO = "info"


@dataclass
class Event:
    """Represents a single event in the system."""
    id: str
    event_type: str
    timestamp: str
    task_id: Optional[str] = None
    data: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert event to dictionary."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> 'Event':
        """Create event from dictionary."""
        return cls(**data)


class MemoryStore:
    """JSONL-based event logging system."""

    def __init__(self, filepath: Path = config.EVENTS_FILE):
        self.filepath = filepath
        self.filepath.parent.mkdir(parents=True, exist_ok=True)
        # Ensure file exists
        if not self.filepath.exists():
            self.filepath.touch()

    def log_event(self, event_type: EventType, data: dict, task_id: Optional[str] = None) -> Event:
        """Log a new event."""
        event = Event(
            id=str(uuid.uuid4()),
            event_type=event_type.value,
            timestamp=datetime.utcnow().isoformat(),
            task_id=task_id,
            data=data
        )
        self._append_event(event)
        return event

    def _append_event(self, event: Event):
        """Append an event to the JSONL file."""
        with open(self.filepath, 'a', encoding='utf-8') as f:
            f.write(json.dumps(event.to_dict()) + '\n')

    def load_all_events(self) -> List[Event]:
        """Load all events from JSONL file."""
        events = []
        if not self.filepath.exists():
            return events

        with open(self.filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        data = json.loads(line)
                        events.append(Event.from_dict(data))
                    except json.JSONDecodeError:
                        continue
        return events

    def get_events_for_task(self, task_id: str) -> List[Event]:
        """Get all events related to a specific task."""
        events = self.load_all_events()
        return [e for e in events if e.task_id == task_id]

    def get_recent_events(self, limit: int = 50) -> List[Event]:
        """Get the most recent events."""
        events = self.load_all_events()
        return events[-limit:]

    def get_events_by_type(self, event_type: str, limit: Optional[int] = None) -> List[Event]:
        """Get all events of a specific type. (v0.1)"""
        events = self.load_all_events()
        filtered = [e for e in events if e.event_type == event_type]
        if limit:
            return filtered[-limit:]
        return filtered

    def get_recent_events_for_task(self, task_id: str, limit: int = 20) -> List[Event]:
        """Get recent events for a specific task. (v0.1)"""
        events = self.get_events_for_task(task_id)
        return events[-limit:]

    def tail_events(self, limit: int = 10) -> List[Event]:
        """Get the very latest events (like 'tail -f'). (v0.1)"""
        return self.get_recent_events(limit=limit)

    def format_events_for_context(self, task_id: str, max_events: int = 20) -> str:
        """Format events for a task into a readable context string."""
        events = self.get_events_for_task(task_id)[-max_events:]
        if not events:
            return "No previous events for this task."

        lines = ["Previous events for this task:"]
        for event in events:
            timestamp = event.timestamp.split('T')[1][:8]  # Just time portion
            lines.append(f"[{timestamp}] {event.event_type}: {json.dumps(event.data, indent=None)}")

        return "\n".join(lines)


# Global memory store instance
memory = MemoryStore()# Global memory store instance
memory = MemoryStore()

