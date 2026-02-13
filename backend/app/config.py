from pydantic_settings import BaseSettings


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
    min_seconds_between_checkins: int = 3600  # 1 hour cooldown per location

    model_config = {"env_file": ".env"}


settings = Settings()
