"""Lightweight FastAPI runner that bridges Project ME and LM Studio.

Run locally with:
    uvicorn runner:app --host 0.0.0.0 --port 4000
"""
from __future__ import annotations

import datetime as _dt
import logging
import os
from typing import Any, Dict, Optional

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


logger = logging.getLogger("project_me.runner")
logging.basicConfig(level=os.getenv("RUNNER_LOG_LEVEL", "INFO"))

app = FastAPI(title="Project ME Runner", version="0.1.0")


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


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("RUNNER_PORT", "4000"))
    uvicorn.run("runner:app", host="0.0.0.0", port=port, reload=False)

