from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    roles: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
