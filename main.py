"""
Project ME v0.1 - Main CLI entrypoint
Local automation and orchestration system.
"""
import sys
import json

from src.tasks import TaskStore
from src.agent import agent
from src.memory import memory
from src.tools import list_tools


def print_banner():
    """Display startup banner."""
    print("\n" + "="*60)
    print(" PROJECT ME v0.2 - Local Automation & Orchestration")
    print("="*60)
    print(" Stack: Python + LM Studio (local LLM)")
    print(" Mode: User-in-the-loop (single-step execution)")
    print(" New in v0.2: LLM sessions with rolling summaries")
    print("="*60 + "\n")


def print_menu():
    """Display the main menu."""
    print("\nMain Menu:")
    print("  1. Create a new task")
    print("  2. Run next pending task")
    print("  3. View recent tasks")
    print("  4. List tasks (with filters)")
    print("  5. Show task details")
    print("  6. View recent events")
    print("  7. Tail events")
    print("  8. List available tools")
    print("  9. Create LLM session task (v0.2)")
    print(" 10. Inspect session (v0.2)")
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
    print("  5. llm_session - Conversational LLM session (v0.2)")
    print()

    choice = input("Select task type (1-5): ").strip()

    # Common fields for all tasks (v0.1)
    title = input("Task title (press Enter to skip): ").strip() or None
    tags_input = input("Tags (comma-separated, press Enter to skip): ").strip()
    tags = [tag.strip() for tag in tags_input.split(",")] if tags_input else []

    if choice == "1":
        command = input("Enter shell command: ").strip()
        cwd = input("Working directory (press Enter for current): ").strip() or None
        payload = {"command": command}
        if cwd:
            payload["cwd"] = cwd
        task = task_store.create_task("shell", payload, title=title, tags=tags)
        print(f"\n✓ Shell task created with ID: {task.id}")

    elif choice == "2":
        prompt = input("Enter your prompt: ").strip()
        system_prompt = input("System prompt (press Enter for default): ").strip()
        payload = {"prompt": prompt}
        if system_prompt:
            payload["system_prompt"] = system_prompt
        task = task_store.create_task("generic_llm", payload, title=title, tags=tags)
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

        task = task_store.create_task("filesystem", payload, title=title, tags=tags)
        print(f"\n✓ Filesystem task created with ID: {task.id}")

    elif choice == "4":
        filepath = input("Enter code file path: ").strip()
        question = input("Enter your question (press Enter for default analysis): ").strip()
        payload = {"filepath": filepath}
        if question:
            payload["question"] = question
        task = task_store.create_task("code_analysis", payload, title=title, tags=tags)
        print(f"\n✓ Code analysis task created with ID: {task.id}")

    elif choice == "5":  # v0.2: llm_session
        session_id = input("Session ID (use existing to continue a conversation): ").strip()
        if not session_id:
            print("Session ID is required")
            return

        message = input("Your message: ").strip()
        if not message:
            print("Message cannot be empty")
            return

        system_prompt = input("System prompt (press Enter for default): ").strip()

        payload = {
            "session_id": session_id,
            "message": message
        }
        if system_prompt:
            payload["system"] = system_prompt

        # Auto-tag with session id
        if session_id not in tags:
            tags.append(f"session:{session_id}")

        task = task_store.create_task("llm_session", payload, title=title, tags=tags)
        print(f"\n✓ LLM session task created with ID: {task.id}")
        print(f"   Session: {session_id}")

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
        if task.title:
            print(f"Title: {task.title}")
        print(f"Type: {task.type}")
        print(f"Status: {task.status}")
        if task.tags:
            print(f"Tags: {', '.join(task.tags)}")
        print(f"Created: {task.created_at}")
        print(f"Payload: {json.dumps(task.payload, indent=2)}")
        if task.error:
            print(f"Error: {task.error}")
        print("-" * 40)


def list_tasks_filtered(task_store: TaskStore):
    """List tasks with optional filters. (v0.1)"""
    print("\n--- List Tasks (with filters) ---")

    # Ask for filters
    print("\nAvailable filters (press Enter to skip any):")
    status = input("  Status (pending/running/done/failed): ").strip() or None
    task_type = input("  Type (shell/generic_llm/filesystem/code_analysis): ").strip() or None
    tag = input("  Tag: ").strip() or None
    limit_str = input("  Limit (default 20): ").strip()
    limit = int(limit_str) if limit_str else 20

    tasks = task_store.get_tasks_filtered(status=status, task_type=task_type, tag=tag, limit=limit)

    if not tasks:
        print("\nNo tasks match your filters.")
        return

    print(f"\nFound {len(tasks)} task(s):\n")
    for task in tasks:
        id_short = task.id[:8]
        title_display = f" | {task.title}" if task.title else ""
        tags_display = f" | tags: {','.join(task.tags)}" if task.tags else ""
        print(f"{id_short}... | {task.status:8s} | {task.type:15s}{title_display}{tags_display}")
    print()


def show_task_details(task_store: TaskStore):
    """Show detailed information about a specific task. (v0.1)"""
    print("\n--- Task Details ---")

    task_id_input = input("Enter task ID (or first 8 characters): ").strip()
    if not task_id_input:
        print("No task ID provided.")
        return

    # Try to find task by full ID or partial ID
    task = task_store.get_task_by_id(task_id_input)
    if not task:
        # Try partial match
        all_tasks = task_store.load_all_tasks()
        matches = [t for t in all_tasks if t.id.startswith(task_id_input)]
        if len(matches) == 1:
            task = matches[0]
        elif len(matches) > 1:
            print(f"\nAmbiguous ID - found {len(matches)} matches:")
            for t in matches:
                print(f"  {t.id[:8]}... | {t.type} | {t.status}")
            return
        else:
            print(f"\nTask not found: {task_id_input}")
            return

    # Display full task details
    print(f"\n{'='*60}")
    print(f"Task ID: {task.id}")
    if task.title:
        print(f"Title: {task.title}")
    print(f"Type: {task.type}")
    print(f"Status: {task.status}")
    if task.tags:
        print(f"Tags: {', '.join(task.tags)}")
    print(f"Created: {task.created_at}")
    print(f"Updated: {task.updated_at}")
    print(f"\nPayload:")
    print(json.dumps(task.payload, indent=2))

    if task.result:
        print(f"\nResult:")
        print(json.dumps(task.result, indent=2))

    if task.error:
        print(f"\nError: {task.error}")

    # Show related events
    print(f"\n{'='*60}")
    print("Related Events:")
    print(f"{'='*60}")

    events = memory.get_events_for_task(task.id)
    if not events:
        print("No events found for this task.")
    else:
        for event in events:
            timestamp = event.timestamp.split('T')[1][:8] if 'T' in event.timestamp else event.timestamp
            print(f"\n[{timestamp}] {event.event_type}")
            if event.data:
                # Show condensed data
                data_str = json.dumps(event.data, indent=2)
                if len(data_str) > 200:
                    data_str = data_str[:200] + "..."
                print(f"  {data_str}")
    print(f"\n{'='*60}")


def tail_events_display():
    """Display the most recent events (tail-like view). (v0.1)"""
    print("\n--- Recent Events (Tail) ---")

    limit_str = input("Number of events to show (default 20): ").strip()
    limit = int(limit_str) if limit_str else 20

    events = memory.tail_events(limit=limit)
    if not events:
        print("\nNo events found.")
        return

    print(f"\nShowing last {len(events)} event(s):\n")
    for event in events:
        timestamp = event.timestamp.split('T')[1][:8] if 'T' in event.timestamp else event.timestamp
        task_ref = f"[{event.task_id[:8]}...]" if event.task_id else "[no task]"

        # Condensed data display
        data_summary = ""
        if event.data:
            if 'tool' in event.data:
                data_summary = f" | tool: {event.data['tool']}"
            elif 'error' in event.data:
                error_msg = event.data['error']
                if len(error_msg) > 40:
                    error_msg = error_msg[:40] + "..."
                data_summary = f" | error: {error_msg}"
            elif 'task_type' in event.data:
                data_summary = f" | type: {event.data['task_type']}"

        print(f"{timestamp} | {event.event_type:20s} | {task_ref}{data_summary}")
    print()


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


def create_llm_session_task(task_store: TaskStore):
    """Create a new LLM session task. (v0.2)"""
    print("\n--- Create LLM Session Task ---")

    session_id = input("Session ID (use existing to continue a conversation): ").strip()
    if not session_id:
        print("Session ID is required")
        return

    # Check if session exists
    existing_messages = memory.get_session_messages(session_id)
    if existing_messages:
        print(f"\n📝 Continuing existing session with {len(existing_messages)} message(s)")
        summary = memory.get_session_summary(session_id)
        if summary:
            print(f"Summary: {summary[:150]}...")
    else:
        print(f"\n✨ Starting new session: {session_id}")

    message = input("\nYour message: ").strip()
    if not message:
        print("Message cannot be empty")
        return

    system_prompt = input("System prompt (press Enter for default): ").strip()
    title = input("Task title (press Enter to skip): ").strip() or None

    payload = {
        "session_id": session_id,
        "message": message
    }
    if system_prompt:
        payload["system"] = system_prompt

    # Auto-tag with session id
    tags = [f"session:{session_id}"]

    task = task_store.create_task("llm_session", payload, title=title, tags=tags)
    print(f"\n✓ LLM session task created with ID: {task.id}")
    print(f"   Session: {session_id}")
    print(f"\n   Run this task to get the LLM response (option 2 from main menu)")


def inspect_session(task_store: TaskStore):
    """Inspect an existing LLM session. (v0.2)"""
    print("\n--- Inspect LLM Session ---")

    session_id = input("Session ID to inspect: ").strip()
    if not session_id:
        print("Session ID is required")
        return

    # Get all messages
    messages = memory.get_session_messages(session_id)

    if not messages:
        print(f"\n❌ No messages found for session: {session_id}")
        return

    print(f"\n{'='*60}")
    print(f"Session: {session_id}")
    print(f"Total messages: {len(messages)}")
    print(f"{'='*60}")

    # Show summary if it exists
    summary = memory.get_session_summary(session_id)
    if summary:
        print(f"\n📋 Summary:")
        print(f"{summary}")
        print(f"\n{'-'*60}")

    # Ask how many messages to show
    limit_str = input(f"\nShow last N messages (default: all {len(messages)}): ").strip()
    limit = int(limit_str) if limit_str else len(messages)

    messages_to_show = messages[-limit:] if limit else messages

    print(f"\n{'='*60}")
    print(f"Showing last {len(messages_to_show)} message(s):")
    print(f"{'='*60}\n")

    for i, msg in enumerate(messages_to_show, 1):
        role_icon = "👤" if msg["role"] == "user" else "🤖"
        timestamp = msg["timestamp"].split('T')[1][:8] if 'T' in msg["timestamp"] else msg["timestamp"]

        print(f"{role_icon} [{timestamp}] {msg['role'].upper()}:")
        print(f"{msg['content']}\n")
        if i < len(messages_to_show):
            print(f"{'-'*60}\n")

    print(f"{'='*60}")

    # Show related tasks
    session_tasks = task_store.get_tasks_by_tag(f"session:{session_id}")
    if session_tasks:
        print(f"\nRelated tasks ({len(session_tasks)}):")
        for task in session_tasks[-5:]:  # Show last 5 tasks
            print(f"  {task.id[:8]}... | {task.status:8s} | {task.title or 'No title'}")
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
            list_tasks_filtered(task_store)
        elif choice == "5":
            show_task_details(task_store)
        elif choice == "6":
            view_recent_events()
        elif choice == "7":
            tail_events_display()
        elif choice == "8":
            list_available_tools()
        elif choice == "9":
            create_llm_session_task(task_store)
        elif choice == "10":
            inspect_session(task_store)
        elif choice == "0":
            print("\nExiting Project ME v0.2. Goodbye!")
            break
        else:
            print("\nInvalid choice. Please try again.")


if __name__ == "__main__":
    # Check if --api flag is passed
    if len(sys.argv) > 1 and sys.argv[1] == "--api":
        print("\n🚀 Starting API server mode...\n")
        try:
            from api_server import start_server
            start_server()
        except KeyboardInterrupt:
            print("\n\nAPI server stopped by user.")
            sys.exit(0)
        except Exception as e:
            print(f"\n\nFatal error starting API server: {str(e)}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    else:
        # Normal CLI mode bro workker                   
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

