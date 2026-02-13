from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CheckIn(Base):
    __tablename__ = "checkins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), index=True
    )
    location_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("locations.id"), index=True
    )

    # Store the user's actual GPS coords at check-in time (for verification)
    user_latitude: Mapped[float] = mapped_column(Float)
    user_longitude: Mapped[float] = mapped_column(Float)

    # How far the user was from the location center (meters)
    distance_meters: Mapped[float] = mapped_column(Float)

    # Points awarded for this check-in
    points_awarded: Mapped[int] = mapped_column(Integer)

    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="checkins")
    location = relationship("Location", back_populates="checkins")
