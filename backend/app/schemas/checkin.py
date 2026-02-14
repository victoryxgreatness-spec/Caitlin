from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CheckInRequest(BaseModel):
    location_id: int
    user_latitude: float
    user_longitude: float


class CheckInResponse(BaseModel):
    id: int
    location_id: int
    location_name: str
    distance_meters: float
    points_awarded: int
    checked_in_at: datetime
    new_achievements: list[str] = []  # names of any achievements unlocked
    next_checkin_available: str = ""  # human-readable cooldown (e.g. "1 year", "24 hours")

    model_config = {"from_attributes": True}


class CheckInHistory(BaseModel):
    id: int
    location_name: str
    points_awarded: int
    distance_meters: float
    checked_in_at: datetime
