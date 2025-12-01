"""
Project ME v0.1 - Local Automation & Orchestration
Main package initialization
"""

__version__ = "0.1.0"
__author__ = "MatinDeevv"

from .agent import Agent, agent
from .tasks import Task, TaskStore, TaskStatus, TaskType
from .memory import MemoryStore, Event, EventType, memory
from .llm_client import LMStudioClient, llm
from .config import *

__all__ = [
    "Agent",
    "agent",
    "Task",
    "TaskStore",
    "TaskStatus",
    "TaskType",
    "MemoryStore",
    "Event",
    "EventType",
    "memory",
    "LMStudioClient",
    "llm",
]

