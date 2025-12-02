"""Lightweight FastAPI runner that bridges Project ME and LM Studio.

Run locally with:
    uvicorn runner:app --host 0.0.0.0 --port 4000
"""
from __future__ import annotations

import datetime as _dt
import logging
import os
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


logger = logging.getLogger("project_me.runner")
logging.basicConfig(level=os.getenv("RUNNER_LOG_LEVEL", "INFO"))

app = FastAPI(title="Project ME Runner", version="0.1.0")

# Sandbox directory - absolute path
SANDBOX_DIR = Path(r"C:\Users\matin\moi\docs\sandbox")
SANDBOX_DIR.mkdir(parents=True, exist_ok=True)


class RunTaskRequest(BaseModel):
    taskId: str = Field(..., alias="task_id")
    title: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True


class RunnerResponse(BaseModel):
    ok: bool
    status: str
    finishedAt: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class SandboxListResponse(BaseModel):
    ok: bool
    entries: List[Dict[str, str]]
    error: Optional[str] = None


class SandboxReadResponse(BaseModel):
    ok: bool
    content: Optional[str] = None
    error: Optional[str] = None


class SandboxWriteRequest(BaseModel):
    path: str
    content: str


class SandboxRenameRequest(BaseModel):
    from_path: str = Field(..., alias="from")
    to_path: str = Field(..., alias="to")

    class Config:
        populate_by_name = True


class SandboxDeleteRequest(BaseModel):
    path: str


class ShellRequest(BaseModel):
    command: str
    cwd: Optional[str] = None


class ShellResponse(BaseModel):
    ok: bool
    output: str
    exitCode: int
    error: Optional[str] = None


LM_ENDPOINT = os.getenv("LM_ENDPOINT", "http://127.0.0.1:1234/v1/chat/completions")
LM_MODEL = os.getenv("LM_MODEL", "gpt-oss:20b")


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "runner": "online",
        "lm_endpoint": LM_ENDPOINT,
        "lm_model": LM_MODEL,
    }


@app.post("/run-task", response_model=RunnerResponse)
def run_task(req: RunTaskRequest) -> RunnerResponse:
    logger.info("[Runner] Received task %s - %s", req.taskId, req.title)

    lm_payload = {
        "model": LM_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are the Project ME agent. You run tasks for Matin.",
            },
            {
                "role": "user",
                "content": (
                    f"Task: {req.title}\n\n"
                    f"Description: {req.description or ''}\n\n"
                    f"Metadata: {req.metadata or {}}"
                ),
            },
        ],
    }

    try:
        logger.debug("[Runner] Calling LM Studio at %s", LM_ENDPOINT)
        lm_res = requests.post(LM_ENDPOINT, json=lm_payload, timeout=60)
        lm_res.raise_for_status()
        lm_json = lm_res.json()
    except requests.RequestException as exc:
        logger.exception("[Runner] LM Studio error")
        raise HTTPException(status_code=502, detail=f"LM Studio error: {exc}") from exc

    finished_at = _dt.datetime.utcnow().isoformat() + "Z"
    logger.info("[Runner] Task %s completed at %s", req.taskId, finished_at)

    return RunnerResponse(ok=True, status="completed", finishedAt=finished_at, raw=lm_json)


# ========== SANDBOX ENDPOINTS ==========

@app.get("/sandbox/list")
def sandbox_list(path: str = "") -> SandboxListResponse:
    """List files and directories in the sandbox."""
    try:
        target_path = SANDBOX_DIR / path if path else SANDBOX_DIR

        if not target_path.exists():
            return SandboxListResponse(ok=False, entries=[], error=f"Path does not exist: {path}")

        if not target_path.is_dir():
            return SandboxListResponse(ok=False, entries=[], error=f"Path is not a directory: {path}")

        entries = []
        for item in target_path.iterdir():
            entries.append({
                "name": item.name,
                "type": "dir" if item.is_dir() else "file"
            })

        logger.info("[Sandbox] Listed %d entries in %s", len(entries), path or "/")
        return SandboxListResponse(ok=True, entries=entries)

    except Exception as exc:
        logger.exception("[Sandbox] List error")
        return SandboxListResponse(ok=False, entries=[], error=str(exc))


@app.get("/sandbox/read")
def sandbox_read(path: str) -> SandboxReadResponse:
    """Read file content from sandbox."""
    try:
        file_path = SANDBOX_DIR / path

        if not file_path.exists():
            return SandboxReadResponse(ok=False, error=f"File does not exist: {path}")

        if not file_path.is_file():
            return SandboxReadResponse(ok=False, error=f"Path is not a file: {path}")

        content = file_path.read_text(encoding="utf-8")
        logger.info("[Sandbox] Read file %s (%d bytes)", path, len(content))
        return SandboxReadResponse(ok=True, content=content)

    except Exception as exc:
        logger.exception("[Sandbox] Read error")
        return SandboxReadResponse(ok=False, error=str(exc))


@app.post("/sandbox/write")
def sandbox_write(req: SandboxWriteRequest) -> Dict[str, Any]:
    """Write content to a file in sandbox."""
    try:
        file_path = SANDBOX_DIR / req.path

        # Create parent directories if needed
        file_path.parent.mkdir(parents=True, exist_ok=True)

        file_path.write_text(req.content, encoding="utf-8")
        logger.info("[Sandbox] Wrote file %s (%d bytes)", req.path, len(req.content))
        return {"ok": True}

    except Exception as exc:
        logger.exception("[Sandbox] Write error")
        return {"ok": False, "error": str(exc)}


@app.post("/sandbox/rename")
def sandbox_rename(req: SandboxRenameRequest) -> Dict[str, Any]:
    """Rename a file or directory in sandbox."""
    try:
        from_path = SANDBOX_DIR / req.from_path
        to_path = SANDBOX_DIR / req.to_path

        if not from_path.exists():
            return {"ok": False, "error": f"Source does not exist: {req.from_path}"}

        from_path.rename(to_path)
        logger.info("[Sandbox] Renamed %s to %s", req.from_path, req.to_path)
        return {"ok": True}

    except Exception as exc:
        logger.exception("[Sandbox] Rename error")
        return {"ok": False, "error": str(exc)}


@app.post("/sandbox/delete")
def sandbox_delete(req: SandboxDeleteRequest) -> Dict[str, Any]:
    """Delete a file or empty directory in sandbox."""
    try:
        file_path = SANDBOX_DIR / req.path

        if not file_path.exists():
            return {"ok": False, "error": f"Path does not exist: {req.path}"}

        if file_path.is_file():
            file_path.unlink()
        elif file_path.is_dir():
            file_path.rmdir()  # Only deletes empty directories

        logger.info("[Sandbox] Deleted %s", req.path)
        return {"ok": True}

    except Exception as exc:
        logger.exception("[Sandbox] Delete error")
        return {"ok": False, "error": str(exc)}


# ========== SHELL ENDPOINT ==========

@app.post("/shell")
def shell(req: ShellRequest) -> ShellResponse:
    """Execute shell command in sandbox directory."""
    try:
        cwd = SANDBOX_DIR / req.cwd if req.cwd else SANDBOX_DIR

        logger.info("[Shell] Running command: %s (cwd=%s)", req.command, cwd)

        result = subprocess.run(
            req.command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=str(cwd),
            timeout=30
        )

        output = result.stdout + result.stderr
        logger.info("[Shell] Command completed with exit code %d", result.returncode)

        return ShellResponse(
            ok=result.returncode == 0,
            output=output,
            exitCode=result.returncode
        )

    except subprocess.TimeoutExpired:
        logger.error("[Shell] Command timeout")
        return ShellResponse(ok=False, output="Command timed out after 30 seconds", exitCode=124)

    except Exception as exc:
        logger.exception("[Shell] Command error")
        return ShellResponse(ok=False, output=str(exc), exitCode=1, error=str(exc))


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("RUNNER_PORT", "4000"))
    uvicorn.run("runner:app", host="0.0.0.0", port=port, reload=False)

