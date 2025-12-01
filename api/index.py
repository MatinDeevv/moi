"""
Vercel serverless function entrypoint for FastAPI backend.
This file exports the FastAPI app instance for Vercel's Python runtime.
"""
from api_server import app

# Vercel looks for 'app' or 'handler' variable
# Export the FastAPI app instance
__all__ = ['app']

