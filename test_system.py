"""
Test script for Project ME v0
Verifies basic functionality without requiring LM Studio.
"""
import sys
from pathlib import Path

print("="*60)
print("Project ME v0 - System Test")
print("="*60)

# Test 1: Module imports
print("\n[1/5] Testing module imports...")
try:
    import config
    import tasks
    import memory
    import llm_client
    import agent
    import main
    from tools import list_tools
    print("✓ All modules imported successfully")
except Exception as e:
    print(f"✗ Import failed: {e}")
    sys.exit(1)

# Test 2: Configuration
print("\n[2/5] Testing configuration...")
try:
    assert config.LOGS_DIR.exists(), "Logs directory not found"
    assert config.TASKS_FILE.parent.exists(), "Tasks file parent directory not found"
    assert config.EVENTS_FILE.parent.exists(), "Events file parent directory not found"
    print(f"✓ Logs directory: {config.LOGS_DIR}")
    print(f"✓ Tasks file: {config.TASKS_FILE}")
    print(f"✓ Events file: {config.EVENTS_FILE}")
except Exception as e:
    print(f"✗ Configuration test failed: {e}")
    sys.exit(1)

# Test 3: Task creation and persistence
print("\n[3/5] Testing task system...")
try:
    from tasks import TaskStore
    store = TaskStore()

    # Create a test task
    test_task = store.create_task(
        task_type="shell",
        payload={"command": "echo test"}
    )
    print(f"✓ Created task: {test_task.id}")

    # Load it back
    loaded_task = store.get_task_by_id(test_task.id)
    assert loaded_task is not None, "Failed to load task"
    assert loaded_task.id == test_task.id, "Task ID mismatch"
    print(f"✓ Task persistence working")

except Exception as e:
    print(f"✗ Task system test failed: {e}")
    sys.exit(1)

# Test 4: Memory/Event logging
print("\n[4/5] Testing memory system...")
try:
    from memory import MemoryStore, EventType
    mem = MemoryStore()

    # Log a test event
    event = mem.log_event(
        EventType.INFO,
        data={"test": "system_test"},
        task_id=test_task.id
    )
    print(f"✓ Created event: {event.id}")

    # Load events for task
    task_events = mem.get_events_for_task(test_task.id)
    assert len(task_events) > 0, "No events found for task"
    print(f"✓ Event persistence working ({len(task_events)} events)")

except Exception as e:
    print(f"✗ Memory system test failed: {e}")
    sys.exit(1)

# Test 5: Tool registry
print("\n[5/5] Testing tool system...")
try:
    from tools import list_tools, get_tool

    available_tools = list_tools()
    assert len(available_tools) > 0, "No tools registered"
    print(f"✓ Registered tools: {', '.join(available_tools)}")

    # Verify we can get a tool
    shell_tool = get_tool("run_shell_command")
    assert shell_tool is not None, "Failed to get shell tool"
    print(f"✓ Tool retrieval working")

except Exception as e:
    print(f"✗ Tool system test failed: {e}")
    sys.exit(1)

# Summary
print("\n" + "="*60)
print("✓ All basic tests passed!")
print("="*60)
print("\nNext steps:")
print("1. Start LM Studio with a model loaded")
print("2. Ensure server is running at http://localhost:1234")
print("3. Run: python main.py")
print("4. Create and execute tasks through the CLI menu")
print("\nSee QUICKSTART.md for detailed usage instructions.")
print("="*60)

