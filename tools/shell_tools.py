"""
Shell tools for Project ME v0
Execute shell commands and capture output.
"""
import subprocess
from typing import Dict, Any

import config
from memory import memory, EventType
from tools import register_tool


@register_tool("run_shell_command")
def run_shell_command(command: str, task_id: str = None, cwd: str = None) -> Dict[str, Any]:
    """
    Execute a shell command and return stdout/stderr.

    Args:
        command: The shell command to execute
        task_id: Optional task ID for logging
        cwd: Optional working directory

    Returns:
        Dict with keys: success (bool), stdout (str), stderr (str), exit_code (int)
    """
    memory.log_event(
        EventType.TOOL_CALLED,
        data={"tool": "run_shell_command", "command": command, "cwd": cwd},
        task_id=task_id
    )

    try:
        # Run command in PowerShell on Windows
        result = subprocess.run(
            ["powershell.exe", "-Command", command],
            capture_output=True,
            text=True,
            timeout=config.SHELL_TIMEOUT_SECONDS,
            cwd=cwd
        )

        stdout = result.stdout
        stderr = result.stderr
        exit_code = result.returncode
        success = exit_code == 0

        # Truncate very long outputs
        if len(stdout) > config.MAX_TOOL_OUTPUT_LENGTH:
            stdout = stdout[:config.MAX_TOOL_OUTPUT_LENGTH] + "\n... [truncated]"
        if len(stderr) > config.MAX_TOOL_OUTPUT_LENGTH:
            stderr = stderr[:config.MAX_TOOL_OUTPUT_LENGTH] + "\n... [truncated]"

        output = {
            "success": success,
            "stdout": stdout,
            "stderr": stderr,
            "exit_code": exit_code
        }

        memory.log_event(
            EventType.TOOL_RESULT,
            data={
                "tool": "run_shell_command",
                "success": success,
                "exit_code": exit_code,
                "stdout_length": len(result.stdout),
                "stderr_length": len(result.stderr)
            },
            task_id=task_id
        )

        return output

    except subprocess.TimeoutExpired:
        error_output = {
            "success": False,
            "stdout": "",
            "stderr": f"Command timed out after {config.SHELL_TIMEOUT_SECONDS} seconds",
            "exit_code": -1
        }

        memory.log_event(
            EventType.ERROR,
            data={"tool": "run_shell_command", "error": "timeout"},
            task_id=task_id
        )

        return error_output

    except Exception as e:
        error_output = {
            "success": False,
            "stdout": "",
            "stderr": f"Exception: {str(e)}",
            "exit_code": -1
        }

        memory.log_event(
            EventType.ERROR,
            data={"tool": "run_shell_command", "error": str(e)},
            task_id=task_id
        )

        return error_output


@register_tool("run_python_script")
def run_python_script(script_path: str, args: list = None, task_id: str = None) -> Dict[str, Any]:
    """
    Execute a Python script with optional arguments.

    Args:
        script_path: Path to the Python script
        args: Optional list of command-line arguments
        task_id: Optional task ID for logging

    Returns:
        Dict with keys: success (bool), stdout (str), stderr (str), exit_code (int)
    """
    args = args or []
    command = f"python {script_path} {' '.join(args)}"
    return run_shell_command(command, task_id=task_id)

