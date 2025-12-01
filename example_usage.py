"""
Example: Using Project ME v0.1 programmatically
This shows how to create and run tasks from Python code instead of the CLI.
"""
from src.tasks import TaskStore
from src.agent import agent

# Initialize task store
store = TaskStore()

print("="*60)
print("Project ME v0 - Programmatic Usage Example")
print("="*60)

# Example 1: Create and run a shell task
print("\n[Example 1] Running a shell command...")
shell_task = store.create_task(
    task_type="shell",
    payload={"command": "Get-Date"}
)
print(f"Created shell task: {shell_task.id}")

result = agent.process_task(shell_task)
print(f"Result: {result}")

# Example 2: Create a filesystem task
print("\n[Example 2] Reading a file...")
fs_task = store.create_task(
    task_type="filesystem",
    payload={
        "operation": "read",
        "filepath": "README.md"
    }
)
print(f"Created filesystem task: {fs_task.id}")

result = agent.process_task(fs_task)
if result['success']:
    print(f"File content (first 200 chars): {result['content'][:200]}...")
else:
    print(f"Error: {result['error']}")

# Example 3: Create a generic LLM task (will fail if LM Studio not running)
print("\n[Example 3] Querying LLM...")
llm_task = store.create_task(
    task_type="generic_llm",
    payload={
        "prompt": "What is the capital of France? Answer in one word.",
        "system_prompt": "You are a helpful assistant that gives concise answers."
    }
)
print(f"Created LLM task: {fs_task.id}")

try:
    result = agent.process_task(llm_task)
    if result['success']:
        print(f"LLM Response: {result['response']}")
    else:
        print(f"Error: {result['error']}")
except Exception as e:
    print(f"Note: LLM task failed - make sure LM Studio is running!")
    print(f"Error: {e}")

# Example 4: View task statistics
print("\n[Example 4] Task Statistics...")
all_tasks = store.load_all_tasks()
print(f"Total tasks in system: {len(all_tasks)}")

status_counts = {}
for task in all_tasks:
    status_counts[task.status] = status_counts.get(task.status, 0) + 1

for status, count in status_counts.items():
    print(f"  {status}: {count}")

print("\n" + "="*60)
print("Examples complete!")
print("Check logs/ directory for full event history.")
print("="*60)

