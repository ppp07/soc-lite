"""Shared FastAPI dependencies."""

from fastapi import Request

from app.core.config import Settings


def get_app_settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings
