"""
Helper utilities for Project ME v0
Common operations and debugging tools.
"""
import json
from pathlib import Path
from tasks import TaskStore
from memory import MemoryStore

def view_logs(log_type="all", limit=20):
    """View logs in a formatted way."""
    if log_type in ["all", "tasks"]:
        print("\n" + "="*60)
        print("RECENT TASKS")
        print("="*60)
        store = TaskStore()
        tasks = store.get_recent_tasks(limit=limit)
        for task in tasks:
            print(f"\nID: {task.id[:8]}...")
            print(f"Type: {task.type} | Status: {task.status}")
            print(f"Payload: {json.dumps(task.payload)}")
            if task.error:
                print(f"Error: {task.error}")
            print("-" * 60)

    if log_type in ["all", "events"]:
        print("\n" + "="*60)
        print("RECENT EVENTS")
        print("="*60)
        mem = MemoryStore()
        events = mem.get_recent_events(limit=limit)
        for event in events:
            timestamp = event.timestamp.split('.')[0].replace('T', ' ')
            task_ref = f"[Task: {event.task_id[:8]}...]" if event.task_id else "[No Task]"
            print(f"{timestamp} | {event.event_type:20s} {task_ref}")
            if event.data:
                # Print condensed data
                data_str = json.dumps(event.data)
                if len(data_str) > 100:
                    data_str = data_str[:100] + "..."
                print(f"  └─ {data_str}")
        print("="*60)

def clear_logs():
    """Clear all logs (use with caution!)"""
    import config
    response = input("Are you sure you want to clear ALL logs? (type 'yes' to confirm): ")
    if response.lower() == 'yes':
        config.TASKS_FILE.write_text('')
        config.EVENTS_FILE.write_text('')
        print("✓ Logs cleared")
    else:
        print("Cancelled")

def stats():
    """Show system statistics."""
    store = TaskStore()
    mem = MemoryStore()

    tasks = store.load_all_tasks()
    events = mem.load_all_events()

    status_counts = {}
    for task in tasks:
        status_counts[task.status] = status_counts.get(task.status, 0) + 1

    print("\n" + "="*60)
    print("PROJECT ME v0 - STATISTICS")
    print("="*60)
    print(f"\nTotal Tasks: {len(tasks)}")
    for status, count in status_counts.items():
        print(f"  - {status}: {count}")
    print(f"\nTotal Events: {len(events)}")

    # Task type breakdown
    type_counts = {}
    for task in tasks:
        type_counts[task.type] = type_counts.get(task.type, 0) + 1

    print(f"\nTask Types:")
    for task_type, count in type_counts.items():
        print(f"  - {task_type}: {count}")

    print("="*60)

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python helpers.py stats           - Show statistics")
        print("  python helpers.py logs [type]     - View logs (type: all/tasks/events)")
        print("  python helpers.py clear           - Clear all logs")
        sys.exit(1)

    command = sys.argv[1]

    if command == "stats":
        stats()
    elif command == "logs":
        log_type = sys.argv[2] if len(sys.argv) > 2 else "all"
        view_logs(log_type=log_type)
    elif command == "clear":
        clear_logs()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

