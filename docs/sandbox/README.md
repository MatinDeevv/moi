# Sandbox Directory

This directory is used by Project ME's Sandbox feature for file management and shell commands.

## Purpose

- **File Management**: Browse, create, edit, and delete files via the web UI
- **Shell Commands**: Execute commands in this directory via the Shell tab
- **Safe Workspace**: Isolated area for Project ME operations

## Usage

1. **Via Web UI**: Navigate to the Sandbox tab to manage files
2. **Via Shell**: Commands execute in this directory by default
3. **Direct Access**: You can also edit files here manually

## Safety

- This directory is isolated from your main system
- Shell commands are restricted to this folder and its subdirectories
- All operations are logged by the runner

## Examples

Create files:
- notes.txt
- scripts/test.py
- data/output.json

Run scripts:
```bash
python scripts/test.py
```

---

**Note**: This directory is created automatically by the runner on startup.

