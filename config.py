"""
Configuration for Project ME v0
All settings for the local orchestration system.
"""
import os
from pathlib import Path

# LM Studio endpoint
LM_STUDIO_BASE_URL = "http://localhost:1234/v1"
LM_STUDIO_MODEL = "gpt-oss:20b"

# LLM parameters
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 2000
PLAN_TEMPERATURE = 0.3  # Lower temperature for structured planning
PLAN_MAX_TOKENS = 1500

# Paths
PROJECT_ROOT = Path(__file__).parent
LOGS_DIR = PROJECT_ROOT / "logs"
TASKS_FILE = LOGS_DIR / "tasks.jsonl"
EVENTS_FILE = LOGS_DIR / "events.jsonl"

# Ensure directories exist
LOGS_DIR.mkdir(exist_ok=True)

# Tool execution settings
SHELL_TIMEOUT_SECONDS = 300  # 5 minutes max for shell commands
MAX_TOOL_OUTPUT_LENGTH = 10000  # Truncate very long outputs in logs

