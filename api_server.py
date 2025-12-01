"""
Project ME v0.2 - FastAPI Server
Thin API layer over existing task/event/agent logic.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn

from src.tasks import TaskStore
from src.agent import agent
from src.memory import memory


app = FastAPI(
    title="Project ME API",
    description="Local automation & orchestration API",
    version="0.2.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CreateTaskRequest(BaseModel):
    title: Optional[str] = None
    type: str
    payload: Dict[str, Any]
    tags: Optional[List[str]] = None


class TaskResponse(BaseModel):
    id: str
    title: Optional[str]
    type: str
    status: str
    payload: Dict[str, Any]
    tags: List[str]
    created_at: str
    updated_at: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class EventResponse(BaseModel):
    task_id: Optional[str]
    event_type: str
    timestamp: str
    data: Dict[str, Any]


class RunTaskResponse(BaseModel):
    success: bool
    task_id: Optional[str]
    result: Optional[Dict[str, Any]]
    error: Optional[str]


# ============================================================================
# HEALTH
# ============================================================================

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "0.2.0"}


# ============================================================================
# TASKS
# ============================================================================

@app.get("/tasks")
def get_tasks(
    limit: int = 50,
    status: Optional[str] = None,
    task_type: Optional[str] = None,
    tag: Optional[str] = None
):
    """
    Get tasks with optional filters.

    Query params:
    - limit: max number of tasks (default 50)
    - status: filter by status (pending/running/done/failed)
    - task_type: filter by type
    - tag: filter by tag
    """
    task_store = TaskStore()

    tasks = task_store.get_tasks_filtered(
        status=status,
        task_type=task_type,
        tag=tag,
        limit=limit
    )

    return {
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "type": t.type,
                "status": t.status,
                "payload": t.payload,
                "tags": t.tags,
                "created_at": t.created_at,
                "updated_at": t.updated_at,
                "result": t.result,
                "error": t.error
            }
            for t in tasks
        ],
        "count": len(tasks)
    }


@app.get("/tasks/{task_id}")
def get_task(task_id: str):
    """Get a single task by ID (supports partial ID match)."""
    task_store = TaskStore()

    task = task_store.get_task_by_id(task_id)

    if not task:
        # Try partial match
        all_tasks = task_store.load_all_tasks()
        matches = [t for t in all_tasks if t.id.startswith(task_id)]

        if len(matches) == 1:
            task = matches[0]
        elif len(matches) > 1:
            raise HTTPException(
                status_code=400,
                detail=f"Ambiguous ID - found {len(matches)} matches"
            )
        else:
            raise HTTPException(status_code=404, detail="Task not found")

    # Get events for this task
    events = memory.get_events_for_task(task.id)

    return {
        "task": {
            "id": task.id,
            "title": task.title,
            "type": task.type,
            "status": task.status,
            "payload": task.payload,
            "tags": task.tags,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "result": task.result,
            "error": task.error
        },
        "events": [
            {
                "task_id": e.task_id,
                "event_type": e.event_type,
                "timestamp": e.timestamp,
                "data": e.data
            }
            for e in events
        ]
    }


@app.post("/tasks")
def create_task(req: CreateTaskRequest):
    """Create a new task."""
    task_store = TaskStore()

    # Validate task type
    valid_types = ["shell", "generic_llm", "filesystem", "code_analysis", "llm_session"]
    if req.type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid task type. Must be one of: {', '.join(valid_types)}"
        )

    try:
        task = task_store.create_task(
            task_type=req.type,
            payload=req.payload,
            title=req.title,
            tags=req.tags or []
        )

        return {
            "success": True,
            "task": {
                "id": task.id,
                "title": task.title,
                "type": task.type,
                "status": task.status,
                "payload": task.payload,
                "tags": task.tags,
                "created_at": task.created_at,
                "updated_at": task.updated_at
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tasks/run-next")
def run_next_task():
    """Run the next pending task."""
    task_store = TaskStore()

    task = task_store.get_next_pending_task()

    if not task:
        return {
            "success": False,
            "task_id": None,
            "result": None,
            "error": "No pending tasks found"
        }

    try:
        result = agent.process_task(task)

        # Reload task to get updated status
        updated_task = task_store.get_task_by_id(task.id)

        return {
            "success": True,
            "task_id": task.id,
            "task": {
                "id": updated_task.id,
                "title": updated_task.title,
                "type": updated_task.type,
                "status": updated_task.status,
                "result": updated_task.result,
                "error": updated_task.error
            },
            "result": result
        }
    except Exception as e:
        return {
            "success": False,
            "task_id": task.id,
            "result": None,
            "error": str(e)
        }


# ============================================================================
# EVENTS
# ============================================================================

@app.get("/events")
def get_events(
    limit: int = 100,
    task_id: Optional[str] = None,
    event_type: Optional[str] = None
):
    """
    Get events with optional filters.

    Query params:
    - limit: max number of events (default 100)
    - task_id: filter by task ID
    - event_type: filter by event type
    """
    if task_id:
        events = memory.get_events_for_task(task_id)
    else:
        events = memory.get_recent_events(limit=limit)

    # Apply event_type filter if specified
    if event_type:
        events = [e for e in events if e.event_type == event_type]

    # Apply limit
    events = events[:limit]

    return {
        "events": [
            {
                "task_id": e.task_id,
                "event_type": e.event_type,
                "timestamp": e.timestamp,
                "data": e.data
            }
            for e in events
        ],
        "count": len(events)
    }


# ============================================================================
# SESSIONS (v0.2)
# ============================================================================

@app.get("/sessions/{session_id}")
def get_session(session_id: str, limit: Optional[int] = None):
    """Get session messages and summary."""
    messages = memory.get_session_messages(session_id)

    if not messages:
        raise HTTPException(status_code=404, detail="Session not found")

    summary = memory.get_session_summary(session_id)

    # Apply limit if specified
    if limit:
        messages = messages[-limit:]

    return {
        "session_id": session_id,
        "messages": messages,
        "summary": summary,
        "message_count": len(messages)
    }


@app.get("/sessions")
def list_sessions():
    """List all unique session IDs from tasks."""
    task_store = TaskStore()
    all_tasks = task_store.load_all_tasks()

    # Extract session IDs from tags
    session_ids = set()
    for task in all_tasks:
        for tag in task.tags:
            if tag.startswith("session:"):
                session_ids.add(tag.replace("session:", ""))

    return {
        "sessions": sorted(list(session_ids)),
        "count": len(session_ids)
    }


# ============================================================================
# MAIN
# ============================================================================

def start_server(host: str = "0.0.0.0", port: int = 8000):
    """Start the FastAPI server."""
    print("\n" + "="*60)
    print(" PROJECT ME API v0.2")
    print("="*60)
    print(f" Server running at: http://{host}:{port}")
    print(f" API docs at: http://{host}:{port}/docs")
    print("="*60 + "\n")

    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    start_server()

