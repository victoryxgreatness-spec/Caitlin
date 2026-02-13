from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Achievement(Base):
    """Defines an achievement type (e.g., 'First Check-In', 'Visit 10 Parks')."""

    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(50), nullable=True)  # emoji or icon name
    category: Mapped[str] = mapped_column(String(50), default="general")
    requirement_type: Mapped[str] = mapped_column(
        String(50)
    )  # total_checkins, unique_locations, category_checkins, points_total
    requirement_value: Mapped[int] = mapped_column(Integer)  # e.g., 10 for "visit 10"
    bonus_points: Mapped[int] = mapped_column(Integer, default=0)


class UserAchievement(Base):
    """Tracks which achievements a user has earned."""

    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), index=True
    )
    achievement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("achievements.id"), index=True
    )
    earned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement")
