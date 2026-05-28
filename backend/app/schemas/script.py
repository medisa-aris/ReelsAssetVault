"""Pydantic schemas for PRD-003: AI Config, Ideation, Script."""
from __future__ import annotations

from datetime import date, time, datetime
from typing import List, Optional
from uuid import UUID

from typing import Literal

from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# AI Config
# ---------------------------------------------------------------------------
class AiConfigResponse(BaseModel):
    id: UUID
    provider: str
    api_key: Optional[str]  # masked in the response layer
    model: Optional[str]
    base_url: Optional[str]
    is_active: bool
    updated_at: datetime


class AiConfigUpdateRequest(BaseModel):
    api_key: Optional[str] = None
    model: Optional[str] = None
    base_url: Optional[str] = None


class AiTestRequest(BaseModel):
    provider_id: Optional[UUID] = None  # None → use active provider


# ---------------------------------------------------------------------------
# Tag (reused from asset schema but imported here independently)
# ---------------------------------------------------------------------------
class TagRef(BaseModel):
    id: UUID
    name: str
    slug: str


# ---------------------------------------------------------------------------
# Ideation
# ---------------------------------------------------------------------------
class IdeationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    niche: Optional[str]
    target_audience: Optional[str]
    platform: Optional[str]
    posting_frequency: Optional[str]
    tone_style: Optional[str]
    hook: Optional[str]
    content_summary: Optional[str]
    cta: Optional[str]
    upload_date: Optional[date]
    upload_time: Optional[time]
    status: str
    notes: Optional[str]
    is_ai_generated: bool
    tags: List[TagRef]
    updated_by_name: Optional[str]
    created_at: datetime
    updated_at: datetime


class IdeationListResponse(BaseModel):
    items: List[IdeationResponse]
    total: int
    page: int
    limit: int


class IdeationCreateRequest(BaseModel):
    title: str
    platform: Optional[str] = None
    upload_date: Optional[date] = None
    upload_time: Optional[time] = None
    hook: Optional[str] = None
    content_summary: Optional[str] = None
    cta: Optional[str] = None
    notes: Optional[str] = None
    tag_ids: List[UUID] = []

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class IdeationUpdateRequest(IdeationCreateRequest):
    status: Optional[str] = None
    niche: Optional[str] = None
    target_audience: Optional[str] = None
    posting_frequency: Optional[str] = None
    tone_style: Optional[str] = None


class IdeationGenerateRequest(BaseModel):
    niche: str
    target_audience: Optional[str] = None
    platform: str
    posting_frequency: Optional[str] = "Daily"
    tone_style: Optional[str] = "Casual"
    week_starting: date

    @field_validator("niche", "platform")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class BulkIdsRequest(BaseModel):
    ids: List[UUID]


class BulkStatusRequest(BaseModel):
    ids: List[UUID]
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        allowed = {"Draft", "Approved", "Script Generated", "Published"}
        if v not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v


# ---------------------------------------------------------------------------
# Script
# ---------------------------------------------------------------------------
class ScriptResponse(BaseModel):
    id: UUID
    ideation_id: Optional[UUID]
    ideation_title: Optional[str]
    user_id: UUID
    title: str
    hook_opening: Optional[str]
    scenes: Optional[str]
    broll_suggestions: Optional[str]
    caption_suggestion: Optional[str]
    cta_ending: Optional[str]
    hashtags: Optional[str]
    version_15s: Optional[str]
    version_30s: Optional[str]
    version_long: Optional[str]
    is_ai_generated: bool
    updated_by_name: Optional[str]
    created_at: datetime
    updated_at: datetime


class ScriptListResponse(BaseModel):
    items: List[ScriptResponse]
    total: int
    page: int
    limit: int


class ScriptUpdateRequest(BaseModel):
    title: Optional[str] = None
    hook_opening: Optional[str] = None
    scenes: Optional[str] = None
    broll_suggestions: Optional[str] = None
    caption_suggestion: Optional[str] = None
    cta_ending: Optional[str] = None
    hashtags: Optional[str] = None
    version_15s: Optional[str] = None
    version_30s: Optional[str] = None
    version_long: Optional[str] = None


class ScriptGenerateRequest(BaseModel):
    ideation_id: UUID
    language: Literal["en", "id"] = "en"  # "en" = English, "id" = Bahasa Indonesia


class IdeationGenerateResponse(BaseModel):
    items: List[IdeationResponse]
    count: int
