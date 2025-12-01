"""
LLM client for Project ME v0
Wrapper around LM Studio's OpenAI-compatible endpoint.
"""
import json
import requests
from typing import List, Dict, Optional, Any

from . import config
from .memory import memory, EventType


class LMStudioClient:
    """Client for interacting with LM Studio's local LLM endpoint."""

    def __init__(
        self,
        base_url: str = config.LM_STUDIO_BASE_URL,
        model: str = config.LM_STUDIO_MODEL
    ):
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.chat_endpoint = f"{self.base_url}/chat/completions"

    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = config.DEFAULT_TEMPERATURE,
        max_tokens: int = config.DEFAULT_MAX_TOKENS,
        task_id: Optional[str] = None,
        response_format: Optional[str] = None  # "json" for JSON mode
    ) -> str:
        """
        Send a chat completion request to LM Studio.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            task_id: Optional task ID for logging
            response_format: Optional "json" to request JSON response

        Returns:
            The assistant's response as a string
        """
        # Log the request
        memory.log_event(
            EventType.LLM_REQUEST,
            data={
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            },
            task_id=task_id
        )

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        # Add response_format if specified
        if response_format == "json":
            payload["response_format"] = {"type": "json_object"}

        try:
            response = requests.post(
                self.chat_endpoint,
                json=payload,
                timeout=120
            )
            response.raise_for_status()

            data = response.json()
            content = data["choices"][0]["message"]["content"]

            # Log the response
            memory.log_event(
                EventType.LLM_RESPONSE,
                data={
                    "content": content[:500],  # Truncate for logging
                    "full_length": len(content)
                },
                task_id=task_id
            )

            return content.strip()

        except requests.exceptions.RequestException as e:
            error_msg = f"LM Studio request failed: {str(e)}"
            memory.log_event(
                EventType.ERROR,
                data={"error": error_msg},
                task_id=task_id
            )
            raise RuntimeError(error_msg) from e
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            error_msg = f"Failed to parse LM Studio response: {str(e)}"
            memory.log_event(
                EventType.ERROR,
                data={"error": error_msg},
                task_id=task_id
            )
            raise RuntimeError(error_msg) from e

    def get_plan(
        self,
        system_prompt: str,
        user_prompt: str,
        task_id: Optional[str] = None
    ) -> str:
        """
        Get a structured plan from the LLM.
        Uses lower temperature for more consistent output.
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        return self.chat(
            messages=messages,
            temperature=config.PLAN_TEMPERATURE,
            max_tokens=config.PLAN_MAX_TOKENS,
            task_id=task_id
        )

    def get_summary(
        self,
        context: str,
        task_id: Optional[str] = None
    ) -> str:
        """
        Get a summary of task execution results.
        """
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant that summarizes task execution results concisely."
            },
            {
                "role": "user",
                "content": f"Summarize the following task execution in 2-3 sentences:\n\n{context}"
            }
        ]

        return self.chat(
            messages=messages,
            temperature=0.5,
            max_tokens=500,
            task_id=task_id
        )


# Global LLM client instance
llm = LMStudioClient()

