from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    project: str
    version: str
    environment: str
    database: str
