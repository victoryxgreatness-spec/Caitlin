from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.achievement import Achievement, UserAchievement
from app.models.user import User
from app.routers.users import get_current_user
from app.schemas.achievement import AchievementResponse, UserAchievementResponse

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("/", response_model=list[AchievementResponse])
def list_achievements(db: Session = Depends(get_db)):
    """List all possible achievements."""
    return db.query(Achievement).all()


@router.get("/mine", response_model=list[UserAchievementResponse])
def my_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get achievements earned by the current user."""
    user_achievements = (
        db.query(UserAchievement)
        .filter(UserAchievement.user_id == current_user.id)
        .all()
    )

    return [
        UserAchievementResponse(
            achievement=AchievementResponse.model_validate(ua.achievement),
            earned_at=ua.earned_at,
        )
        for ua in user_achievements
    ]
