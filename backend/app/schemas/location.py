from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LocationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    point_value: int = 10
    category: str = "landmark"


class LocationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    latitude: float
    longitude: float
    point_value: int
    category: str
    created_at: datetime

    model_config = {"from_attributes": True}


class NearbyLocationResponse(LocationResponse):
    distance_meters: float
