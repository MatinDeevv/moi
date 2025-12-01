"""
Filesystem tools for Project ME v0
File and directory operations with logging.
"""
import os
from pathlib import Path
from typing import Dict, Any, List

from .. import config
from ..memory import memory, EventType
from . import register_tool


@register_tool("read_file")
def read_file(filepath: str, task_id: str = None) -> Dict[str, Any]:
    """
    Read the contents of a file.

    Args:
        filepath: Path to the file to read
        task_id: Optional task ID for logging

    Returns:
        Dict with keys: success (bool), content (str), error (str or None)
    """
    memory.log_event(
        EventType.TOOL_CALLED,
        data={"tool": "read_file", "filepath": filepath},
        task_id=task_id
    )

    try:
        path = Path(filepath)
        if not path.exists():
            return {
                "success": False,
                "content": "",
                "error": f"File not found: {filepath}"
            }

        if not path.is_file():
            return {
                "success": False,
                "content": "",
                "error": f"Not a file: {filepath}"
            }

        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Truncate if too large
        if len(content) > config.MAX_TOOL_OUTPUT_LENGTH:
            content = content[:config.MAX_TOOL_OUTPUT_LENGTH] + "\n... [truncated]"

        memory.log_event(
            EventType.TOOL_RESULT,
            data={
                "tool": "read_file",
                "success": True,
                "content_length": len(content)
            },
            task_id=task_id
        )

        return {
            "success": True,
            "content": content,
            "error": None
        }

    except Exception as e:
        memory.log_event(
            EventType.ERROR,
            data={"tool": "read_file", "error": str(e)},
            task_id=task_id
        )

        return {
            "success": False,
            "content": "",
            "error": str(e)
        }


@register_tool("write_file")
def write_file(filepath: str, content: str, task_id: str = None) -> Dict[str, Any]:
    """
    Write content to a file (overwrites existing content).

    Args:
        filepath: Path to the file to write
        content: Content to write
        task_id: Optional task ID for logging

    Returns:
        Dict with keys: success (bool), error (str or None)
    """
    memory.log_event(
        EventType.TOOL_CALLED,
        data={
            "tool": "write_file",
            "filepath": filepath,
            "content_length": len(content)
        },
        task_id=task_id
    )

    try:
        path = Path(filepath)
        # Create parent directories if needed
        path.parent.mkdir(parents=True, exist_ok=True)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

        memory.log_event(
            EventType.TOOL_RESULT,
            data={
                "tool": "write_file",
                "success": True,
                "filepath": filepath
            },
            task_id=task_id
        )

        return {
            "success": True,
            "error": None
        }

    except Exception as e:
        memory.log_event(
            EventType.ERROR,
            data={"tool": "write_file", "error": str(e)},
            task_id=task_id
        )

        return {
            "success": False,
            "error": str(e)
        }


@register_tool("list_directory")
def list_directory(dirpath: str, task_id: str = None) -> Dict[str, Any]:
    """
    List contents of a directory.

    Args:
        dirpath: Path to the directory
        task_id: Optional task ID for logging

    Returns:
        Dict with keys: success (bool), files (list), directories (list), error (str or None)
    """
    memory.log_event(
        EventType.TOOL_CALLED,
        data={"tool": "list_directory", "dirpath": dirpath},
        task_id=task_id
    )

    try:
        path = Path(dirpath)
        if not path.exists():
            return {
                "success": False,
                "files": [],
                "directories": [],
                "error": f"Directory not found: {dirpath}"
            }

        if not path.is_dir():
            return {
                "success": False,
                "files": [],
                "directories": [],
                "error": f"Not a directory: {dirpath}"
            }

        files = []
        directories = []

        for item in path.iterdir():
            if item.is_file():
                files.append(item.name)
            elif item.is_dir():
                directories.append(item.name)

        memory.log_event(
            EventType.TOOL_RESULT,
            data={
                "tool": "list_directory",
                "success": True,
                "file_count": len(files),
                "dir_count": len(directories)
            },
            task_id=task_id
        )

        return {
            "success": True,
            "files": sorted(files),
            "directories": sorted(directories),
            "error": None
        }

    except Exception as e:
        memory.log_event(
            EventType.ERROR,
            data={"tool": "list_directory", "error": str(e)},
            task_id=task_id
        )

        return {
            "success": False,
            "files": [],
            "directories": [],
            "error": str(e)
        }


@register_tool("append_file")
def append_file(filepath: str, content: str, task_id: str = None) -> Dict[str, Any]:
    """
    Append content to a file.

    Args:
        filepath: Path to the file
        content: Content to append
        task_id: Optional task ID for logging

    Returns:
        Dict with keys: success (bool), error (str or None)
    """
    memory.log_event(
        EventType.TOOL_CALLED,
        data={
            "tool": "append_file",
            "filepath": filepath,
            "content_length": len(content)
        },
        task_id=task_id
    )

    try:
        path = Path(filepath)
        # Create parent directories if needed
        path.parent.mkdir(parents=True, exist_ok=True)

        with open(path, 'a', encoding='utf-8') as f:
            f.write(content)

        memory.log_event(
            EventType.TOOL_RESULT,
            data={
                "tool": "append_file",
                "success": True,
                "filepath": filepath
            },
            task_id=task_id
        )

        return {
            "success": True,
            "error": None
        }

    except Exception as e:
        memory.log_event(
            EventType.ERROR,
            data={"tool": "append_file", "error": str(e)},
            task_id=task_id
        )

        return {
            "success": False,
            "error": str(e)
        }

