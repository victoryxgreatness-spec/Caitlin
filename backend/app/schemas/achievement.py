from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AchievementResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: Optional[str]
    category: str
    requirement_type: str
    requirement_value: int
    bonus_points: int

    model_config = {"from_attributes": True}


class UserAchievementResponse(BaseModel):
    achievement: AchievementResponse
    earned_at: datetime
