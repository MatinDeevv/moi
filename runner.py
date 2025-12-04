"""Lightweight FastAPI runner that bridges Project ME and LM Studio.

Run locally with:
    python runner.py

Features:
- Automatic ngrok tunnel management
- LM Studio integration
- Sandbox file operations
- System file browser (browse any folder)
- Code analysis (send files to LLM)
- Shell command execution (with optional admin)
"""
from __future__ import annotations

import atexit
import datetime as _dt
import fnmatch
import json
import logging
import os
import signal
import string
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field


logger = logging.getLogger("project_me.runner")
logging.basicConfig(
    level=os.getenv("RUNNER_LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(title="Project ME Runner", version="0.3.0")

# ========== NGROK MANAGEMENT ==========
ngrok_process: Optional[subprocess.Popen] = None
ngrok_url: Optional[str] = None
ngrok_lock = threading.Lock()


def get_ngrok_url() -> Optional[str]:
    """Get the current ngrok public URL from the local API."""
    try:
        response = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
        if response.ok:
            data = response.json()
            tunnels = data.get("tunnels", [])
            for tunnel in tunnels:
                if tunnel.get("proto") == "https":
                    return tunnel.get("public_url")
    except Exception as e:
        logger.debug(f"[ngrok] Could not get tunnel info: {e}")
    return None


def start_ngrok(port: int) -> Optional[str]:
    """Start ngrok and return the public URL."""
    global ngrok_process, ngrok_url

    with ngrok_lock:
        # Check if ngrok is already running
        existing_url = get_ngrok_url()
        if existing_url:
            # Check if it's pointing to our port
            try:
                response = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
                data = response.json()
                for tunnel in data.get("tunnels", []):
                    config = tunnel.get("config", {})
                    addr = config.get("addr", "")
                    if str(port) in addr:
                        logger.info(f"[ngrok] Already running: {existing_url}")
                        ngrok_url = existing_url
                        return existing_url
            except:
                pass

            logger.warning("[ngrok] Running but pointing to wrong port, restarting...")
            stop_ngrok()

        logger.info(f"[ngrok] Starting tunnel for port {port}...")

        try:
            # Start ngrok process
            ngrok_process = subprocess.Popen(
                ["ngrok", "http", str(port), "--log=stdout"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )

            # Wait for ngrok to start and get the URL
            for _ in range(30):  # Wait up to 15 seconds
                time.sleep(0.5)
                url = get_ngrok_url()
                if url:
                    ngrok_url = url
                    logger.info(f"[ngrok] Tunnel established: {url}")
                    print(f"\n{'='*60}")
                    print(f"[NGROK] URL: {url}")
                    print(f"{'='*60}\n")
                    return url

            logger.error("[ngrok] Failed to get tunnel URL after 15 seconds")
            return None

        except FileNotFoundError:
            logger.error("[ngrok] ngrok executable not found. Please install ngrok.")
            return None
        except Exception as e:
            logger.exception(f"[ngrok] Failed to start: {e}")
            return None


def stop_ngrok():
    """Stop the ngrok process."""
    global ngrok_process, ngrok_url

    with ngrok_lock:
        if ngrok_process:
            logger.info("[ngrok] Stopping tunnel...")
            try:
                ngrok_process.terminate()
                ngrok_process.wait(timeout=5)
            except:
                ngrok_process.kill()
            ngrok_process = None
            ngrok_url = None


def cleanup():
    """Cleanup function called on exit."""
    logger.info("[Runner] Shutting down...")
    stop_ngrok()


# Register cleanup handlers
atexit.register(cleanup)

# Sandbox directory - absolute path
SANDBOX_DIR = Path(r"C:\Users\matin\moi\docs\sandbox")
SANDBOX_DIR.mkdir(parents=True, exist_ok=True)


class RunTaskRequest(BaseModel):
    taskId: str = Field(..., alias="task_id")
    title: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)


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

    model_config = ConfigDict(populate_by_name=True)


class SandboxDeleteRequest(BaseModel):
    path: str


class ShellRequest(BaseModel):
    command: str
    cwd: Optional[str] = None
    admin: bool = False  # Run with elevated privileges


class ShellResponse(BaseModel):
    ok: bool
    output: str
    exitCode: int
    error: Optional[str] = None


# New: Code Analysis Request
class CodeAnalysisRequest(BaseModel):
    files: List[str]  # List of file paths (relative to sandbox or absolute)
    prompt: str  # What to analyze/do with the files
    include_content: bool = True  # Include file content in LLM context


class CodeAnalysisResponse(BaseModel):
    ok: bool
    analysis: Optional[str] = None
    files_analyzed: List[str] = []
    error: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None


# New: System File Browser Request
class FileBrowserRequest(BaseModel):
    path: str  # Absolute path to browse
    recursive: bool = False  # Include subdirectories
    pattern: Optional[str] = None  # Glob pattern filter (e.g., "*.py")


LM_ENDPOINT = os.getenv("LM_ENDPOINT", "http://127.0.0.1:1234/v1/chat/completions")
LM_MODEL = os.getenv("LM_MODEL", "gpt-oss:20b")


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "runner": "online",
        "lm_endpoint": LM_ENDPOINT,
        "lm_model": LM_MODEL,
        "ngrok_url": ngrok_url,
    }


@app.get("/ngrok-url")
def get_ngrok_status() -> Dict[str, Any]:
    """Get current ngrok tunnel URL."""
    current_url = get_ngrok_url()
    return {
        "ok": True,
        "ngrok_url": current_url,
        "active": current_url is not None
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
    """Execute shell command. Optionally with admin privileges."""
    try:
        cwd = SANDBOX_DIR / req.cwd if req.cwd else SANDBOX_DIR

        logger.info("[Shell] Running command: %s (cwd=%s, admin=%s)", req.command, cwd, req.admin)

        if req.admin and sys.platform == "win32":
            # Run with elevated privileges on Windows using PowerShell
            # This will prompt UAC if not already elevated
            ps_command = f'Start-Process powershell -ArgumentList "-NoProfile -Command {req.command}" -Verb RunAs -Wait -PassThru'
            result = subprocess.run(
                ["powershell", "-NoProfile", "-Command", ps_command],
                capture_output=True,
                text=True,
                cwd=str(cwd),
                timeout=60
            )
        else:
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


# ========== SYSTEM FILE BROWSER ==========

@app.get("/browse")
def browse_system(path: str = "", recursive: bool = False, pattern: Optional[str] = None) -> Dict[str, Any]:
    """Browse any directory on the system (not limited to sandbox).

    Args:
        path: Absolute path to browse. Empty string = list drives on Windows
        recursive: If true, include subdirectories
        pattern: Glob pattern to filter files (e.g., "*.py", "*.txt")
    """
    try:
        # If no path, list drives on Windows or root on Unix
        if not path or path == "":
            if sys.platform == "win32":
                import string
                drives = []
                for letter in string.ascii_uppercase:
                    drive = f"{letter}:\\"
                    if Path(drive).exists():
                        drives.append({"name": drive, "type": "drive"})
                return {"ok": True, "entries": drives, "path": ""}
            else:
                path = "/"

        target_path = Path(path)

        if not target_path.exists():
            return {"ok": False, "entries": [], "error": f"Path does not exist: {path}"}

        if not target_path.is_dir():
            # If it's a file, return file info
            return {
                "ok": True,
                "entries": [{
                    "name": target_path.name,
                    "type": "file",
                    "size": target_path.stat().st_size,
                    "path": str(target_path)
                }],
                "path": str(target_path.parent)
            }

        entries = []

        # Add parent directory link
        if target_path.parent != target_path:
            entries.append({"name": "..", "type": "dir", "path": str(target_path.parent)})

        if recursive and pattern:
            # Recursive with pattern
            for item in target_path.rglob(pattern):
                try:
                    entries.append({
                        "name": item.name,
                        "type": "dir" if item.is_dir() else "file",
                        "path": str(item),
                        "relative": str(item.relative_to(target_path))
                    })
                except:
                    pass
        else:
            # Non-recursive listing
            for item in target_path.iterdir():
                try:
                    if pattern and not item.is_dir():
                        import fnmatch
                        if not fnmatch.fnmatch(item.name, pattern):
                            continue

                    entry = {
                        "name": item.name,
                        "type": "dir" if item.is_dir() else "file",
                        "path": str(item)
                    }

                    if item.is_file():
                        try:
                            entry["size"] = item.stat().st_size
                        except:
                            pass

                    entries.append(entry)
                except PermissionError:
                    # Skip files/dirs we can't access
                    pass

        logger.info("[Browse] Listed %d entries in %s", len(entries), path)
        return {"ok": True, "entries": entries, "path": str(target_path)}

    except PermissionError:
        return {"ok": False, "entries": [], "error": f"Permission denied: {path}"}
    except Exception as exc:
        logger.exception("[Browse] Error")
        return {"ok": False, "entries": [], "error": str(exc)}


@app.get("/browse/read")
def browse_read_file(path: str) -> Dict[str, Any]:
    """Read a file from anywhere on the system."""
    try:
        file_path = Path(path)

        if not file_path.exists():
            return {"ok": False, "error": f"File does not exist: {path}"}

        if not file_path.is_file():
            return {"ok": False, "error": f"Path is not a file: {path}"}

        # Check file size (limit to 1MB for safety)
        size = file_path.stat().st_size
        if size > 1024 * 1024:
            return {"ok": False, "error": f"File too large ({size} bytes). Max 1MB."}

        # Try to read as text
        try:
            content = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                content = file_path.read_text(encoding="latin-1")
            except:
                return {"ok": False, "error": "File is not text or has unsupported encoding"}

        logger.info("[Browse] Read file %s (%d bytes)", path, len(content))
        return {
            "ok": True,
            "content": content,
            "path": str(file_path),
            "size": size,
            "name": file_path.name
        }

    except PermissionError:
        return {"ok": False, "error": f"Permission denied: {path}"}
    except Exception as exc:
        logger.exception("[Browse] Read error")
        return {"ok": False, "error": str(exc)}


# ========== CODE ANALYSIS ==========

@app.post("/analyze")
def analyze_code(req: CodeAnalysisRequest) -> CodeAnalysisResponse:
    """Send files to LLM for code analysis.

    This endpoint:
    1. Reads the specified files
    2. Builds a context with file contents
    3. Sends to LLM with your prompt
    4. Returns the analysis
    """
    try:
        files_content = []
        files_analyzed = []

        for file_path_str in req.files:
            try:
                # Support both absolute paths and sandbox-relative paths
                if Path(file_path_str).is_absolute():
                    file_path = Path(file_path_str)
                else:
                    file_path = SANDBOX_DIR / file_path_str

                if not file_path.exists():
                    logger.warning("[Analyze] File not found: %s", file_path_str)
                    continue

                if not file_path.is_file():
                    logger.warning("[Analyze] Not a file: %s", file_path_str)
                    continue

                # Read file content
                try:
                    content = file_path.read_text(encoding="utf-8")
                except UnicodeDecodeError:
                    content = file_path.read_text(encoding="latin-1")

                if req.include_content:
                    files_content.append(f"=== File: {file_path.name} ===\n```\n{content}\n```\n")
                else:
                    files_content.append(f"=== File: {file_path.name} (path: {file_path}) ===\n")

                files_analyzed.append(str(file_path))
                logger.info("[Analyze] Loaded file: %s (%d bytes)", file_path.name, len(content))

            except Exception as e:
                logger.warning("[Analyze] Error reading %s: %s", file_path_str, e)

        if not files_analyzed:
            return CodeAnalysisResponse(
                ok=False,
                error="No files could be read",
                files_analyzed=[]
            )

        # Build LLM prompt
        files_context = "\n".join(files_content)
        full_prompt = f"""You are a code analysis expert. Analyze the following files and respond to the user's request.

{files_context}

User Request: {req.prompt}

Provide a detailed, helpful response."""

        lm_payload = {
            "model": LM_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert code analyst and software engineer. Analyze code carefully and provide detailed, accurate responses."
                },
                {
                    "role": "user",
                    "content": full_prompt
                }
            ],
            "temperature": 0.3,  # Lower temperature for more focused analysis
        }

        logger.info("[Analyze] Sending %d files to LLM", len(files_analyzed))

        try:
            lm_res = requests.post(LM_ENDPOINT, json=lm_payload, timeout=120)
            lm_res.raise_for_status()
            lm_json = lm_res.json()

            # Extract the response text
            analysis = lm_json.get("choices", [{}])[0].get("message", {}).get("content", "No response")

            return CodeAnalysisResponse(
                ok=True,
                analysis=analysis,
                files_analyzed=files_analyzed,
                raw=lm_json
            )

        except requests.RequestException as exc:
            logger.exception("[Analyze] LM Studio error")
            return CodeAnalysisResponse(
                ok=False,
                error=f"LLM error: {exc}",
                files_analyzed=files_analyzed
            )

    except Exception as exc:
        logger.exception("[Analyze] Error")
        return CodeAnalysisResponse(ok=False, error=str(exc), files_analyzed=[])


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("RUNNER_PORT", "4000"))
    auto_ngrok = os.getenv("AUTO_NGROK", "true").lower() in ("true", "1", "yes")

    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        logger.info("\n[Runner] Received shutdown signal...")
        cleanup()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print(f"\n{'='*60}")
    print(f"[*] PROJECT ME RUNNER v0.3.0")
    print(f"{'='*60}")
    print(f"[>] Port: {port}")
    print(f"[>] LM Studio: {LM_ENDPOINT}")
    print(f"[>] Sandbox: {SANDBOX_DIR}")
    print(f"{'='*60}")
    print(f"[i] Endpoints:")
    print(f"   /health       - Health check")
    print(f"   /run-task     - Execute task with LLM")
    print(f"   /analyze      - Code analysis with LLM")
    print(f"   /browse       - System file browser")
    print(f"   /browse/read  - Read any file")
    print(f"   /shell        - Execute commands (admin optional)")
    print(f"   /sandbox/*    - Sandbox file operations")
    print(f"{'='*60}\n")

    # Start ngrok if enabled
    if auto_ngrok:
        tunnel_url = start_ngrok(port)
        if tunnel_url:
            print(f"[OK] ngrok tunnel ready!")
            print(f"   Use this URL in your Vercel Settings: {tunnel_url}")
        else:
            print("[WARN] ngrok failed to start. Runner will still work locally.")
            print("   You can manually run: ngrok http 4000")
    else:
        print("[INFO] Auto-ngrok disabled. Set AUTO_NGROK=true to enable.")

    print(f"\n{'='*60}\n")

    # Run the server
    uvicorn.run("runner:app", host="0.0.0.0", port=port, reload=False)

