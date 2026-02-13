from fastapi import FastAPI

from app.config import settings
from app.routers import achievements, checkins, locations, users

app = FastAPI(
    title=settings.app_name,
    description="Go outside. Earn points. Touch grass.",
    version="0.1.0",
)

app.include_router(users.router)
app.include_router(locations.router)
app.include_router(checkins.router)
app.include_router(achievements.router)


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "message": "Go outside. Earn points. Touch grass.",
        "version": "0.1.0",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
