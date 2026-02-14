from pydantic_settings import BaseSettings


# Cooldown per location category (in seconds)
# The idea: rare destinations = long cooldowns (you earned it, no farming).
# Daily-visit spots like city parks = short cooldowns (encourages going outside).
CATEGORY_COOLDOWNS: dict[str, int] = {
    "nature": 365 * 24 * 3600,     # 1 year  — bucket-list trips (Yellowstone, Grand Canyon)
    "monument": 90 * 24 * 3600,    # 90 days — revisit on seasonal trips
    "landmark": 30 * 24 * 3600,    # 30 days — locals cross the Golden Gate monthly
    "park": 24 * 3600,             # 24 hours — daily outdoor habit, the core loop
    "business": 4 * 3600,          # 4 hours  — partner businesses want foot traffic
}

DEFAULT_COOLDOWN_SECONDS: int = 24 * 3600  # fallback: 24 hours


class Settings(BaseSettings):
    app_name: str = "Touch Grass"
    debug: bool = False

    # Database
    database_url: str = "postgresql://localhost:5432/touchgrass"

    # Auth
    secret_key: str = "CHANGE-ME-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Geolocation
    checkin_radius_meters: float = 50.0  # how close you need to be to a location

    model_config = {"env_file": ".env"}


def get_cooldown_seconds(category: str) -> int:
    """Get the cooldown duration for a location category."""
    return CATEGORY_COOLDOWNS.get(category, DEFAULT_COOLDOWN_SECONDS)


def format_cooldown_message(seconds_remaining: int) -> str:
    """Format remaining cooldown into a human-readable string."""
    if seconds_remaining >= 365 * 24 * 3600:
        years = seconds_remaining / (365 * 24 * 3600)
        return f"{years:.0f} year{'s' if years >= 2 else ''}"
    elif seconds_remaining >= 24 * 3600:
        days = seconds_remaining / (24 * 3600)
        return f"{days:.0f} day{'s' if days >= 2 else ''}"
    elif seconds_remaining >= 3600:
        hours = seconds_remaining / 3600
        return f"{hours:.0f} hour{'s' if hours >= 2 else ''}"
    else:
        minutes = max(1, seconds_remaining // 60)
        return f"{minutes} minute{'s' if minutes >= 2 else ''}"


settings = Settings()
