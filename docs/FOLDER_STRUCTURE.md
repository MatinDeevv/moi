# Project ME v0.1 - Folder Structure

## Overview
Reorganized folder structure for better maintainability and separation of concerns.

## New Directory Layout

```
moi/                          # Project root
├── docs/                     # All documentation (NEW)
│   ├── COMMANDS.md          # Available CLI commands reference
│   ├── IMPLEMENTATION_SUMMARY.md  # Technical implementation details
│   ├── PHASE_0.1_COMPLETE.md     # Phase 0.1 completion summary
│   ├── PHASE_v0.2_SUMMARY.md     # Phase 0.2 features (not implemented)
│   ├── QUICKSTART.md        # Quick start guide
│   └── QUICKSTART_v0.2.md   # v0.2 quick start (future)
│
├── src/                      # Source code package (NEW)
│   ├── __init__.py          # Package initialization
│   ├── agent.py             # Task orchestrator
│   ├── config.py            # Configuration settings
│   ├── helpers.py           # Helper utilities
│   ├── llm_client.py        # LM Studio client wrapper
│   ├── memory.py            # Event logging system
│   ├── tasks.py             # Task model & persistence
│   └── tools/               # Tool implementations
│       ├── __init__.py      # Tool registry
│       ├── fs_tools.py      # Filesystem tools
│       └── shell_tools.py   # Shell command tools
│
├── logs/                     # Runtime logs (auto-created)
│   ├── tasks.jsonl          # Task persistence
│   └── events.jsonl         # Event log
│
├── main.py                   # CLI entrypoint
├── example_usage.py          # Programmatic usage examples
├── test_system.py            # System test script
├── requirements.txt          # Python dependencies
├── README.md                 # Main README
├── .gitignore               # Git ignore rules
└── .venv/                   # Virtual environment (gitignored)
```

---

## Key Changes from Previous Structure

### Before (Flat Structure)
```
moi/
├── agent.py
├── config.py
├── tasks.py
├── memory.py
├── llm_client.py
├── helpers.py
├── main.py
├── COMMANDS.md
├── QUICKSTART.md
├── PHASE_0.1_COMPLETE.md
├── ... (many more .md files)
└── tools/
    ├── fs_tools.py
    └── shell_tools.py
```

**Problems:**
- ❌ All files mixed in root directory
- ❌ Documentation scattered with code
- ❌ No clear package structure
- ❌ Difficult to navigate
- ❌ Hard to import modules cleanly

### After (Organized Structure)
```
moi/
├── docs/          # All documentation together
├── src/           # All source code together
├── logs/          # Runtime data
└── main.py        # Entry point in root
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Easy to find documentation
- ✅ Proper Python package structure
- ✅ Clean imports (`from src import ...`)
- ✅ Scalable for future growth
- ✅ IDE-friendly structure

---

## Import Changes

### Old Imports (Flat)
```python
# In any file
import config
from tasks import TaskStore
from memory import memory
from tools import get_tool
```

### New Imports (Package)
```python
# In files outside src/ (main.py, example_usage.py, etc.)
from src import config
from src.tasks import TaskStore
from src.memory import memory
from src.tools import get_tool

# In files inside src/ (relative imports)
from . import config
from .tasks import TaskStore
from .memory import memory
from .tools import get_tool
```

---

## Module Structure

### `src/` Package

**Core Modules:**
- `config.py` - All configuration settings
  - LM Studio endpoint
  - Model settings
  - Paths (adjusted for new structure)
  - Tool execution settings

- `tasks.py` - Task management
  - `Task` dataclass (with title, tags, timestamps)
  - `TaskStore` (JSONL persistence)
  - `TaskStatus`, `TaskType` enums
  - Filtering methods

- `memory.py` - Event logging
  - `Event` dataclass (structured events)
  - `MemoryStore` (JSONL event log)
  - `EventType` enum
  - Query methods (get events by task, tail, etc.)

- `agent.py` - Orchestrator
  - `Agent` class
  - Task routing logic
  - Handlers for each task type
  - Global `agent` instance

- `llm_client.py` - LLM integration
  - `LMStudioClient` class
  - OpenAI-compatible API wrapper
  - Global `llm` instance

- `helpers.py` - Utility functions

**Tools Subpackage:**
- `tools/__init__.py` - Tool registry
- `tools/shell_tools.py` - Shell command execution
- `tools/fs_tools.py` - File operations

---

## Path Configuration

**Updated in `src/config.py`:**

```python
# Old (when in root)
PROJECT_ROOT = Path(__file__).parent

# New (when in src/)
PROJECT_ROOT = Path(__file__).parent.parent  # Go up to moi/
```

This ensures logs are written to `moi/logs/` not `moi/src/logs/`.

---

## Documentation Organization

All `.md` files moved to `docs/`:

| File | Description |
|------|-------------|
| `COMMANDS.md` | CLI command reference |
| `IMPLEMENTATION_SUMMARY.md` | Technical architecture |
| `PHASE_0.1_COMPLETE.md` | Phase 0.1 implementation details |
| `PHASE_v0.2_SUMMARY.md` | Phase 0.2 features (future) |
| `QUICKSTART.md` | Getting started guide |
| `QUICKSTART_v0.2.md` | v0.2 quick start (future) |

**README.md stays in root** for GitHub visibility.

---

## Entry Points

### Main CLI (`main.py`)
```bash
python main.py
```

Imports from `src` package and runs the interactive CLI.

### Example Usage (`example_usage.py`)
```bash
python example_usage.py
```

Shows how to use Project ME programmatically.

### System Test (`test_system.py`)
```bash
python test_system.py
```

Validates that all modules import and basic functionality works.

---

## Migration Notes

### For Developers

**No code changes needed in core logic**, only import statements:

1. **Entry point files** (main.py, example_usage.py, test_system.py):
   - Changed `import tasks` → `from src import tasks`
   - Changed `from tasks import X` → `from src.tasks import X`

2. **Files inside src/**:
   - Changed `import config` → `from . import config`
   - Changed `from tasks import X` → `from .tasks import X`

3. **Tools inside src/tools/**:
   - Changed `import config` → `from .. import config`
   - Changed `from memory import X` → `from ..memory import X`

### For Users

**No changes required!** Just run:
```bash
python main.py
```

All paths and imports are handled automatically.

---

## Benefits of New Structure

### 1. Scalability
- Easy to add new modules to `src/`
- Easy to add new tools to `src/tools/`
- Can add `tests/`, `scripts/`, `data/` folders as needed

### 2. Clarity
- Code in `src/`
- Docs in `docs/`
- Logs in `logs/`
- Clear purpose for each folder

### 3. Professional
- Standard Python project layout
- Familiar to other developers
- IDE auto-completion works better
- Easier to package/distribute later

### 4. Maintainability
- Related files grouped together
- Easy to navigate in IDE
- Clear module boundaries
- Better dependency management

---

## Future Enhancements

Possible additions to structure:

```
moi/
├── docs/          # Documentation
├── src/           # Source code
├── tests/         # Unit tests (TODO)
├── scripts/       # Utility scripts (TODO)
├── data/          # Sample data, configs (TODO)
└── logs/          # Runtime logs
```

---

## Version Control

### What's Tracked
- ✅ `src/` - All source code
- ✅ `docs/` - All documentation
- ✅ `main.py`, `example_usage.py`, `test_system.py`
- ✅ `requirements.txt`
- ✅ `README.md`

### What's Ignored (`.gitignore`)
- ❌ `logs/` - Runtime data
- ❌ `__pycache__/` - Python cache
- ❌ `.venv/` - Virtual environment
- ❌ `.idea/` - IDE settings

---

## Quick Reference

**Run the application:**
```bash
python main.py
```

**Run tests:**
```bash
python test_system.py
```

**Run example:**
```bash
python example_usage.py
```

**Import in code:**
```python
from src.tasks import TaskStore
from src.agent import agent
from src.memory import memory
```

**Documentation:**
```bash
docs/QUICKSTART.md        # Start here
docs/COMMANDS.md          # CLI reference
docs/PHASE_0.1_COMPLETE.md  # Implementation details
```

---

## Summary

✅ **Completed:**
- Created `docs/` folder for all documentation
- Created `src/` package for all source code
- Updated all imports to use new structure
- Updated `config.py` paths to work from `src/`
- Verified all modules compile and import correctly
- Maintained full backward compatibility

✅ **Result:**
- Clean, professional project structure
- Easy to navigate and maintain
- Scalable for future growth
- No functional changes - everything works as before!

**Project ME v0.1 - Now with professional folder structure!** 🎉

