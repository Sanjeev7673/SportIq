from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class SportBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Sport name (e.g., Football, Basketball)")
    description: Optional[str] = Field(None, description="Sport description and category notes")


class SportCreate(SportBase):
    pass


class SportUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None


class SportResponse(SportBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
