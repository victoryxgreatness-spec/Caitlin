from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)

    # PostGIS geography column for spatial queries
    # SRID 4326 = WGS84 (standard GPS coordinate system)
    coords = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=False
    )

    point_value: Mapped[int] = mapped_column(Integer, default=10)
    category: Mapped[str] = mapped_column(
        String(50), default="landmark"
    )  # landmark, park, monument, business, etc.

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    checkins = relationship("CheckIn", back_populates="location")
