from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.users import get_current_user
from app.schemas.checkin import CheckInHistory, CheckInRequest, CheckInResponse
from app.services.geo import validate_checkin_proximity
from app.services.scoring import award_checkin, check_achievements

router = APIRouter(prefix="/checkins", tags=["checkins"])


@router.post("/", response_model=CheckInResponse, status_code=201)
def check_in(
    request: CheckInRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check in at a location. Must be within the required radius.

    This is the main action in the app — the user is at a physical location
    and wants to claim their points.
    """
    # 1. Verify the user is actually close enough
    proximity = validate_checkin_proximity(
        db=db,
        user_id=current_user.id,
        location_id=request.location_id,
        user_lat=request.user_latitude,
        user_lng=request.user_longitude,
    )

    if not proximity["is_valid"]:
        raise HTTPException(status_code=400, detail=proximity["reason"])

    # 2. Award points and create the check-in record
    checkin = award_checkin(
        db=db,
        user=current_user,
        location=proximity["location"],
        distance_meters=proximity["distance_meters"],
        user_lat=request.user_latitude,
        user_lng=request.user_longitude,
    )

    # 3. Check if any new achievements were unlocked
    new_achievements = check_achievements(db=db, user=current_user)

    return CheckInResponse(
        id=checkin.id,
        location_id=checkin.location_id,
        location_name=proximity["location"].name,
        distance_meters=checkin.distance_meters,
        points_awarded=checkin.points_awarded,
        checked_in_at=checkin.checked_in_at,
        new_achievements=[a.name for a in new_achievements],
    )


@router.get("/history", response_model=list[CheckInHistory])
def checkin_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's check-in history."""
    from app.models.checkin import CheckIn
    from app.models.location import Location

    checkins = (
        db.query(CheckIn, Location.name)
        .join(Location)
        .filter(CheckIn.user_id == current_user.id)
        .order_by(CheckIn.checked_in_at.desc())
        .limit(limit)
        .all()
    )

    return [
        CheckInHistory(
            id=ci.id,
            location_name=name,
            points_awarded=ci.points_awarded,
            distance_meters=ci.distance_meters,
            checked_in_at=ci.checked_in_at,
        )
        for ci, name in checkins
    ]
