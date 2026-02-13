"""Geolocation validation service.

Handles the core question: "Is this user actually at the location they claim to be?"
"""

from datetime import datetime, timedelta, timezone

from geopy.distance import geodesic
from sqlalchemy.orm import Session

from app.config import settings
from app.models.checkin import CheckIn
from app.models.location import Location


def calculate_distance_meters(
    lat1: float, lng1: float, lat2: float, lng2: float
) -> float:
    """Calculate distance between two GPS coordinates in meters.

    Uses the geodesic (ellipsoidal) distance — more accurate than haversine
    for real-world GPS coordinates.
    """
    return geodesic((lat1, lng1), (lat2, lng2)).meters


def validate_checkin_proximity(
    db: Session,
    user_id: int,
    location_id: int,
    user_lat: float,
    user_lng: float,
) -> dict:
    """Validate whether a user can check in at a location.

    Checks:
    1. Location exists
    2. User is within the required radius
    3. User hasn't checked in here too recently (cooldown)

    Returns a dict with validation results.
    """
    # 1. Does the location exist?
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        return {"is_valid": False, "reason": "Location not found"}

    # 2. Is the user close enough?
    distance = calculate_distance_meters(
        user_lat, user_lng, location.latitude, location.longitude
    )

    if distance > settings.checkin_radius_meters:
        return {
            "is_valid": False,
            "reason": (
                f"Too far away. You're {distance:.0f}m from {location.name}, "
                f"but need to be within {settings.checkin_radius_meters:.0f}m. "
                "Go touch that grass!"
            ),
            "distance_meters": distance,
        }

    # 3. Has the user checked in here recently? (cooldown)
    cooldown_cutoff = datetime.now(timezone.utc) - timedelta(
        seconds=settings.min_seconds_between_checkins
    )
    recent_checkin = (
        db.query(CheckIn)
        .filter(
            CheckIn.user_id == user_id,
            CheckIn.location_id == location_id,
            CheckIn.checked_in_at > cooldown_cutoff,
        )
        .first()
    )

    if recent_checkin:
        return {
            "is_valid": False,
            "reason": (
                f"You already checked in at {location.name} recently. "
                f"Come back in {settings.min_seconds_between_checkins // 60} minutes."
            ),
        }

    return {
        "is_valid": True,
        "location": location,
        "distance_meters": distance,
    }
