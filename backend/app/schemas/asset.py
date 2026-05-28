from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator


class TagResponse(BaseModel):
    id: UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}


class AssetResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    filename: str
    file_size_bytes: int
    duration_seconds: Optional[float]
    width: Optional[int]
    height: Optional[int]
    mime_type: Optional[str]
    thumbnail_url: Optional[str]
    file_url: Optional[str]
    tags: List[TagResponse]
    updated_by_name: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": False}


class AssetListResponse(BaseModel):
    items: List[AssetResponse]
    total: int
    page: int
    limit: int


class AssetUpdateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    tag_ids: List[UUID] = []

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()
