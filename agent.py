"""
Agent orchestrator for Project ME v0
Core logic for processing tasks with LLM planning and tool execution.
"""
import json
from typing import Dict, Any, List, Optional

from tasks import Task, TaskStore, TaskStatus
from memory import memory, EventType
from llm_client import llm
from tools import get_tool, list_tools


class Agent:
    """
    Core orchestrator that processes tasks using LLM planning and tool execution.
    Single-step execution model: process one task, then return control to user.
    """

    def __init__(self):
        self.task_store = TaskStore()

    def process_task(self, task: Task) -> Dict[str, Any]:
        """
        Process a single task:
        1. Load context (task payload, previous events)
        2. Call LLM for a PLAN
        3. Execute plan steps (tool calls)
        4. Generate summary
        5. Update task status

        Returns a result dict with success status and summary.
        """
        print(f"\n{'='*60}")
        print(f"Processing task: {task.id}")
        print(f"Type: {task.type}")
        print(f"Payload: {json.dumps(task.payload, indent=2)}")
        print(f"{'='*60}\n")

        # Update task to RUNNING
        task.update_status(TaskStatus.RUNNING)
        self.task_store.update_task(task)

        # Log task start
        memory.log_event(
            EventType.TASK_STARTED,
            data={"task_type": task.type, "payload": task.payload},
            task_id=task.id
        )

        try:
            # Route to appropriate handler based on task type
            if task.type == "shell":
                result = self._handle_shell_task(task)
            elif task.type == "generic_llm":
                result = self._handle_generic_llm_task(task)
            elif task.type == "filesystem":
                result = self._handle_filesystem_task(task)
            elif task.type == "code_analysis":
                result = self._handle_code_analysis_task(task)
            else:
                raise ValueError(f"Unknown task type: {task.type}")

            # Mark as done
            task.update_status(TaskStatus.DONE, result=result)
            self.task_store.update_task(task)

            memory.log_event(
                EventType.TASK_COMPLETED,
                data={"result": result},
                task_id=task.id
            )

            print(f"\n✓ Task completed successfully")
            return result

        except Exception as e:
            error_msg = f"Task failed: {str(e)}"
            print(f"\n✗ {error_msg}")

            task.update_status(TaskStatus.FAILED, error=error_msg)
            self.task_store.update_task(task)

            memory.log_event(
                EventType.TASK_FAILED,
                data={"error": error_msg},
                task_id=task.id
            )

            return {
                "success": False,
                "error": error_msg
            }

    def _handle_shell_task(self, task: Task) -> Dict[str, Any]:
        """Handle a shell command task."""
        command = task.payload.get("command")
        if not command:
            raise ValueError("Shell task requires 'command' in payload")

        cwd = task.payload.get("cwd")

        print(f"Executing shell command: {command}")
        if cwd:
            print(f"Working directory: {cwd}")

        # Execute the command
        tool = get_tool("run_shell_command")
        result = tool(command=command, cwd=cwd, task_id=task.id)

        # Display results
        print(f"\nExit code: {result['exit_code']}")
        if result['stdout']:
            print(f"\nStdout:\n{result['stdout']}")
        if result['stderr']:
            print(f"\nStderr:\n{result['stderr']}")

        return {
            "success": result["success"],
            "output": result["stdout"],
            "error": result["stderr"] if not result["success"] else None
        }

    def _handle_generic_llm_task(self, task: Task) -> Dict[str, Any]:
        """Handle a generic LLM query task."""
        prompt = task.payload.get("prompt")
        if not prompt:
            raise ValueError("generic_llm task requires 'prompt' in payload")

        system_prompt = task.payload.get("system_prompt", "You are a helpful AI assistant.")

        print(f"Sending prompt to LLM...")
        print(f"System: {system_prompt[:100]}...")
        print(f"User: {prompt[:200]}...")

        # Call LLM
        response = llm.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            task_id=task.id
        )

        print(f"\nLLM Response:\n{response}")

        return {
            "success": True,
            "response": response
        }

    def _handle_filesystem_task(self, task: Task) -> Dict[str, Any]:
        """Handle filesystem operations."""
        operation = task.payload.get("operation")
        if not operation:
            raise ValueError("filesystem task requires 'operation' in payload")

        # Map operation to tool
        tool_map = {
            "read": "read_file",
            "write": "write_file",
            "append": "append_file",
            "list": "list_directory"
        }

        if operation not in tool_map:
            raise ValueError(f"Unknown filesystem operation: {operation}")

        tool_name = tool_map[operation]
        tool = get_tool(tool_name)

        print(f"Executing filesystem operation: {operation}")

        # Extract parameters based on operation
        if operation == "read":
            filepath = task.payload.get("filepath")
            if not filepath:
                raise ValueError("read operation requires 'filepath'")
            result = tool(filepath=filepath, task_id=task.id)

        elif operation == "write":
            filepath = task.payload.get("filepath")
            content = task.payload.get("content", "")
            if not filepath:
                raise ValueError("write operation requires 'filepath'")
            result = tool(filepath=filepath, content=content, task_id=task.id)

        elif operation == "append":
            filepath = task.payload.get("filepath")
            content = task.payload.get("content", "")
            if not filepath:
                raise ValueError("append operation requires 'filepath'")
            result = tool(filepath=filepath, content=content, task_id=task.id)

        elif operation == "list":
            dirpath = task.payload.get("dirpath")
            if not dirpath:
                raise ValueError("list operation requires 'dirpath'")
            result = tool(dirpath=dirpath, task_id=task.id)

        print(f"\nResult: {json.dumps(result, indent=2)}")

        return result

    def _handle_code_analysis_task(self, task: Task) -> Dict[str, Any]:
        """Handle code analysis with LLM assistance."""
        filepath = task.payload.get("filepath")
        question = task.payload.get("question", "Analyze this code and provide insights.")

        if not filepath:
            raise ValueError("code_analysis task requires 'filepath'")

        print(f"Analyzing code file: {filepath}")

        # Read the file
        read_tool = get_tool("read_file")
        read_result = read_tool(filepath=filepath, task_id=task.id)

        if not read_result["success"]:
            raise ValueError(f"Failed to read file: {read_result['error']}")

        code_content = read_result["content"]

        # Ask LLM to analyze
        print(f"Asking LLM: {question}")

        analysis = llm.chat(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert code analyzer. Provide clear, actionable insights."
                },
                {
                    "role": "user",
                    "content": f"Question: {question}\n\nCode:\n```\n{code_content}\n```"
                }
            ],
            task_id=task.id
        )

        print(f"\nAnalysis:\n{analysis}")

        return {
            "success": True,
            "analysis": analysis,
            "filepath": filepath
        }


# Global agent instance
agent = Agent()

