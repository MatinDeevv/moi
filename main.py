"""
Project ME v0 - Main CLI entrypoint
Local automation and orchestration system.
"""
import sys
import json
from typing import Optional

from tasks import TaskStore, TaskType
from agent import agent
from memory import memory
from tools import list_tools


def print_banner():
    """Display startup banner."""
    print("\n" + "="*60)
    print(" PROJECT ME v0 - Local Automation & Orchestration")
    print("="*60)
    print(" Stack: Python + LM Studio (local LLM)")
    print(" Mode: User-in-the-loop (single-step execution)")
    print("="*60 + "\n")


def print_menu():
    """Display the main menu."""
    print("\nMain Menu:")
    print("  1. Create a new task")
    print("  2. Run next pending task")
    print("  3. View recent tasks")
    print("  4. View recent events")
    print("  5. List available tools")
    print("  0. Exit")
    print()


def create_task_interactive(task_store: TaskStore):
    """Interactive task creation flow."""
    print("\n--- Create New Task ---")
    print("\nAvailable task types:")
    print("  1. shell - Execute a shell command")
    print("  2. generic_llm - Ask the LLM a question")
    print("  3. filesystem - File operations (read/write/list)")
    print("  4. code_analysis - Analyze code with LLM")
    print()

    choice = input("Select task type (1-4): ").strip()

    if choice == "1":
        command = input("Enter shell command: ").strip()
        cwd = input("Working directory (press Enter for current): ").strip() or None
        payload = {"command": command}
        if cwd:
            payload["cwd"] = cwd
        task = task_store.create_task("shell", payload)
        print(f"\n✓ Shell task created with ID: {task.id}")

    elif choice == "2":
        prompt = input("Enter your prompt: ").strip()
        system_prompt = input("System prompt (press Enter for default): ").strip()
        payload = {"prompt": prompt}
        if system_prompt:
            payload["system_prompt"] = system_prompt
        task = task_store.create_task("generic_llm", payload)
        print(f"\n✓ Generic LLM task created with ID: {task.id}")

    elif choice == "3":
        print("\nFilesystem operations:")
        print("  1. read - Read a file")
        print("  2. write - Write to a file")
        print("  3. append - Append to a file")
        print("  4. list - List directory contents")
        op_choice = input("Select operation (1-4): ").strip()

        op_map = {"1": "read", "2": "write", "3": "append", "4": "list"}
        operation = op_map.get(op_choice)

        if not operation:
            print("Invalid operation choice")
            return

        payload = {"operation": operation}

        if operation in ["read", "write", "append"]:
            filepath = input("Enter file path: ").strip()
            payload["filepath"] = filepath
            if operation in ["write", "append"]:
                content = input("Enter content: ").strip()
                payload["content"] = content
        elif operation == "list":
            dirpath = input("Enter directory path: ").strip()
            payload["dirpath"] = dirpath

        task = task_store.create_task("filesystem", payload)
        print(f"\n✓ Filesystem task created with ID: {task.id}")

    elif choice == "4":
        filepath = input("Enter code file path: ").strip()
        question = input("Enter your question (press Enter for default analysis): ").strip()
        payload = {"filepath": filepath}
        if question:
            payload["question"] = question
        task = task_store.create_task("code_analysis", payload)
        print(f"\n✓ Code analysis task created with ID: {task.id}")

    else:
        print("Invalid task type choice")


def run_next_task(task_store: TaskStore):
    """Run the next pending task."""
    print("\n--- Run Next Pending Task ---")

    task = task_store.get_next_pending_task()
    if not task:
        print("\nNo pending tasks found.")
        return

    print(f"Found pending task: {task.id}")
    confirm = input("Execute this task? (y/n): ").strip().lower()

    if confirm == 'y':
        result = agent.process_task(task)
        print("\nTask execution complete.")
        print(f"Result: {json.dumps(result, indent=2)}")
    else:
        print("Task execution cancelled.")


def view_recent_tasks(task_store: TaskStore):
    """Display recent tasks."""
    print("\n--- Recent Tasks ---")

    tasks = task_store.get_recent_tasks(limit=10)
    if not tasks:
        print("\nNo tasks found.")
        return

    for task in tasks:
        print(f"\nID: {task.id}")
        print(f"Type: {task.type}")
        print(f"Status: {task.status}")
        print(f"Created: {task.created_at}")
        print(f"Payload: {json.dumps(task.payload, indent=2)}")
        if task.error:
            print(f"Error: {task.error}")
        print("-" * 40)


def view_recent_events():
    """Display recent events."""
    print("\n--- Recent Events ---")

    events = memory.get_recent_events(limit=20)
    if not events:
        print("\nNo events found.")
        return

    for event in events:
        print(f"\n[{event.timestamp}] {event.event_type}")
        if event.task_id:
            print(f"Task: {event.task_id}")
        print(f"Data: {json.dumps(event.data, indent=2)}")
        print("-" * 40)


def list_available_tools():
    """List all registered tools."""
    print("\n--- Available Tools ---")
    tools = list_tools()
    for i, tool_name in enumerate(tools, 1):
        print(f"  {i}. {tool_name}")
    print()


def main():
    """Main CLI loop."""
    print_banner()

    task_store = TaskStore()

    while True:
        print_menu()
        choice = input("Enter your choice: ").strip()

        if choice == "1":
            create_task_interactive(task_store)
        elif choice == "2":
            run_next_task(task_store)
        elif choice == "3":
            view_recent_tasks(task_store)
        elif choice == "4":
            view_recent_events()
        elif choice == "5":
            list_available_tools()
        elif choice == "0":
            print("\nExiting Project ME v0. Goodbye!")
            break
        else:
            print("\nInvalid choice. Please try again.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user. Exiting...")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nFatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

