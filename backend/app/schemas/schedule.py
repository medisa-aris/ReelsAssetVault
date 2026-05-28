from __future__ import annotations

from datetime import date, datetime, time
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class ScheduleCreateRequest(BaseModel):
    asset_id: Optional[UUID] = None
    ideation_id: Optional[UUID] = None
    script_id: Optional[UUID] = None
    scheduled_date: date
    scheduled_time: str = "09:00"
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("scheduled_date")
    @classmethod
    def date_not_in_past(cls, v: date) -> date:
        if v < date.today():
            raise ValueError("scheduled_date must be today or in the future")
        return v

    @field_validator("scheduled_time")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        try:
            time.fromisoformat(v if len(v) == 8 else v + ":00")
        except ValueError:
            raise ValueError("scheduled_time must be HH:MM or HH:MM:SS")
        return v


class ScheduleUpdateRequest(BaseModel):
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("scheduled_date")
    @classmethod
    def date_not_in_past(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v < date.today():
            raise ValueError("scheduled_date must be today or in the future")
        return v

    @field_validator("scheduled_time")
    @classmethod
    def validate_time_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            time.fromisoformat(v if len(v) == 8 else v + ":00")
        except ValueError:
            raise ValueError("scheduled_time must be HH:MM or HH:MM:SS")
        return v


class RejectRequest(BaseModel):
    reason: str


class StatusAdvanceRequest(BaseModel):
    status: str


class ScheduleResponse(BaseModel):
    id: UUID
    asset_id: Optional[UUID] = None
    asset_title: Optional[str] = None
    asset_thumbnail_url: Optional[str] = None
    ideation_id: Optional[UUID] = None
    ideation_title: Optional[str] = None
    script_id: Optional[UUID] = None
    script_title: Optional[str] = None
    scheduled_date: date
    scheduled_time: str
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    notes: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    user_id: UUID
    updated_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScheduleListResponse(BaseModel):
    items: List[ScheduleResponse]
    total: int
    page: int
    limit: int
