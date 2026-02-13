"""Scoring and achievement service.

Handles point awards and achievement unlocks.
"""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.achievement import Achievement, UserAchievement
from app.models.checkin import CheckIn
from app.models.location import Location
from app.models.user import User


def award_checkin(
    db: Session,
    user: User,
    location: Location,
    distance_meters: float,
    user_lat: float,
    user_lng: float,
) -> CheckIn:
    """Create a check-in record and award points to the user.

    The closer you are to the exact location, the more bonus points you get:
    - Within 10m: +50% bonus
    - Within 25m: +25% bonus
    - Within 50m: base points
    """
    base_points = location.point_value

    # Proximity bonus — reward people who get really close
    if distance_meters <= 10:
        bonus_multiplier = 1.5
    elif distance_meters <= 25:
        bonus_multiplier = 1.25
    else:
        bonus_multiplier = 1.0

    points_awarded = int(base_points * bonus_multiplier)

    # Create the check-in record
    checkin = CheckIn(
        user_id=user.id,
        location_id=location.id,
        user_latitude=user_lat,
        user_longitude=user_lng,
        distance_meters=round(distance_meters, 1),
        points_awarded=points_awarded,
    )
    db.add(checkin)

    # Update user's total points
    user.total_points += points_awarded

    db.commit()
    db.refresh(checkin)
    return checkin


def check_achievements(db: Session, user: User) -> list[Achievement]:
    """Check if the user has unlocked any new achievements.

    Runs after each check-in to see if milestones were reached.
    Returns list of newly unlocked achievements.
    """
    # Get IDs of achievements the user already has
    earned_ids = {
        ua.achievement_id
        for ua in db.query(UserAchievement)
        .filter(UserAchievement.user_id == user.id)
        .all()
    }

    # Get all achievements the user hasn't earned yet
    unearned = (
        db.query(Achievement).filter(Achievement.id.notin_(earned_ids)).all()
        if earned_ids
        else db.query(Achievement).all()
    )

    newly_earned = []

    for achievement in unearned:
        if _meets_requirement(db, user, achievement):
            # Award the achievement
            user_achievement = UserAchievement(
                user_id=user.id, achievement_id=achievement.id
            )
            db.add(user_achievement)

            # Award bonus points if any
            if achievement.bonus_points > 0:
                user.total_points += achievement.bonus_points

            newly_earned.append(achievement)

    if newly_earned:
        db.commit()

    return newly_earned


def _meets_requirement(db: Session, user: User, achievement: Achievement) -> bool:
    """Check if a user meets the requirements for a specific achievement."""
    req_type = achievement.requirement_type
    req_value = achievement.requirement_value

    if req_type == "total_checkins":
        count = db.query(func.count(CheckIn.id)).filter(
            CheckIn.user_id == user.id
        ).scalar()
        return count >= req_value

    elif req_type == "unique_locations":
        count = (
            db.query(func.count(func.distinct(CheckIn.location_id)))
            .filter(CheckIn.user_id == user.id)
            .scalar()
        )
        return count >= req_value

    elif req_type == "category_checkins":
        # Requires checking in at N locations of a specific category
        # Category is encoded in the achievement name (e.g., "Park Explorer")
        count = (
            db.query(func.count(CheckIn.id))
            .join(Location)
            .filter(
                CheckIn.user_id == user.id,
                Location.category == achievement.category,
            )
            .scalar()
        )
        return count >= req_value

    elif req_type == "points_total":
        return user.total_points >= req_value

    return False
