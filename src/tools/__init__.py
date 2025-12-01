"""
Tools package for Project ME v0
Registry and loader for all available tools.
"""
from typing import Dict, Callable, Any

# Tool registry: maps tool names to callable functions
TOOL_REGISTRY: Dict[str, Callable] = {}


def register_tool(name: str):
    """Decorator to register a tool function."""
    def decorator(func: Callable):
        TOOL_REGISTRY[name] = func
        return func
    return decorator


def get_tool(name: str) -> Callable:
    """Get a tool function by name."""
    if name not in TOOL_REGISTRY:
        raise ValueError(f"Unknown tool: {name}")
    return TOOL_REGISTRY[name]


def list_tools() -> list:
    """List all registered tool names."""
    return list(TOOL_REGISTRY.keys())


# Import tool modules to trigger registration
from . import shell_tools, fs_tools

