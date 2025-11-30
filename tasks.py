"""
Task management for Project ME v0
Dataclass definitions and JSONL persistence.
"""
import json
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, List
from enum import Enum

import config


class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


class TaskType(Enum):
    SHELL = "shell"
    CODE_ANALYSIS = "code_analysis"
    GENERIC_LLM = "generic_llm"
    FILESYSTEM = "filesystem"


@dataclass
class Task:
    """Represents a single task in the orchestration system."""
    id: str
    type: str
    payload: dict
    status: str = TaskStatus.PENDING.value
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    result: Optional[dict] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert task to dictionary."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> 'Task':
        """Create task from dictionary."""
        return cls(**data)

    def update_status(self, status: TaskStatus, result: Optional[dict] = None, error: Optional[str] = None):
        """Update task status and timestamp."""
        self.status = status.value
        self.updated_at = datetime.utcnow().isoformat()
        if result is not None:
            self.result = result
        if error is not None:
            self.error = error


class TaskStore:
    """JSONL-based task persistence."""

    def __init__(self, filepath: Path = config.TASKS_FILE):
        self.filepath = filepath
        self.filepath.parent.mkdir(parents=True, exist_ok=True)
        # Ensure file exists
        if not self.filepath.exists():
            self.filepath.touch()

    def create_task(self, task_type: str, payload: dict) -> Task:
        """Create a new task and persist it."""
        task = Task(
            id=str(uuid.uuid4()),
            type=task_type,
            payload=payload
        )
        self._append_task(task)
        return task

    def _append_task(self, task: Task):
        """Append a task to the JSONL file."""
        with open(self.filepath, 'a', encoding='utf-8') as f:
            f.write(json.dumps(task.to_dict()) + '\n')

    def update_task(self, task: Task):
        """Update an existing task by rewriting the file."""
        tasks = self.load_all_tasks()
        with open(self.filepath, 'w', encoding='utf-8') as f:
            for t in tasks:
                if t.id == task.id:
                    f.write(json.dumps(task.to_dict()) + '\n')
                else:
                    f.write(json.dumps(t.to_dict()) + '\n')

    def load_all_tasks(self) -> List[Task]:
        """Load all tasks from JSONL file."""
        tasks = []
        if not self.filepath.exists():
            return tasks

        with open(self.filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        data = json.loads(line)
                        tasks.append(Task.from_dict(data))
                    except json.JSONDecodeError:
                        continue
        return tasks

    def get_next_pending_task(self) -> Optional[Task]:
        """Get the next pending task (FIFO order)."""
        tasks = self.load_all_tasks()
        for task in tasks:
            if task.status == TaskStatus.PENDING.value:
                return task
        return None

    def get_task_by_id(self, task_id: str) -> Optional[Task]:
        """Retrieve a specific task by ID."""
        tasks = self.load_all_tasks()
        for task in tasks:
            if task.id == task_id:
                return task
        return None

    def get_recent_tasks(self, limit: int = 10) -> List[Task]:
        """Get the most recent tasks."""
        tasks = self.load_all_tasks()
        return tasks[-limit:]

