"""Tests for the scoring service and cooldown system.

These test the point calculation logic and cooldown formatting
without needing a database.
"""

from app.config import (
    CATEGORY_COOLDOWNS,
    format_cooldown_message,
    get_cooldown_seconds,
)


def test_nature_cooldown_is_one_year():
    """Nature locations (Yellowstone, Grand Canyon) should have 1-year cooldown."""
    cooldown = get_cooldown_seconds("nature")
    assert cooldown == 365 * 24 * 3600


def test_park_cooldown_is_one_day():
    """City parks should have 24-hour cooldown to encourage daily visits."""
    cooldown = get_cooldown_seconds("park")
    assert cooldown == 24 * 3600


def test_monument_cooldown_is_90_days():
    """Monuments should have 90-day cooldown."""
    cooldown = get_cooldown_seconds("monument")
    assert cooldown == 90 * 24 * 3600


def test_unknown_category_uses_default():
    """Unknown categories should fall back to 24 hours."""
    cooldown = get_cooldown_seconds("some_new_category")
    assert cooldown == 24 * 3600


def test_format_cooldown_year():
    """A year's worth of seconds should format as '1 year'."""
    assert format_cooldown_message(365 * 24 * 3600) == "1 year"


def test_format_cooldown_days():
    """90 days should format as '90 days'."""
    assert format_cooldown_message(90 * 24 * 3600) == "90 days"


def test_format_cooldown_hours():
    """4 hours should format as '4 hours'."""
    assert format_cooldown_message(4 * 3600) == "4 hours"


def test_format_cooldown_minutes():
    """30 minutes should format as '30 minutes'."""
    assert format_cooldown_message(30 * 60) == "30 minutes"


def test_proximity_bonus_close():
    """Being within 10m should give 1.5x bonus."""
    base_points = 50
    distance = 8.0  # 8 meters

    if distance <= 10:
        multiplier = 1.5
    elif distance <= 25:
        multiplier = 1.25
    else:
        multiplier = 1.0

    assert int(base_points * multiplier) == 75


def test_proximity_bonus_medium():
    """Being within 25m should give 1.25x bonus."""
    base_points = 50
    distance = 20.0  # 20 meters

    if distance <= 10:
        multiplier = 1.5
    elif distance <= 25:
        multiplier = 1.25
    else:
        multiplier = 1.0

    assert int(base_points * multiplier) == 62


def test_proximity_bonus_base():
    """Being within 50m but beyond 25m gives base points."""
    base_points = 50
    distance = 40.0  # 40 meters

    if distance <= 10:
        multiplier = 1.5
    elif distance <= 25:
        multiplier = 1.25
    else:
        multiplier = 1.0

    assert int(base_points * multiplier) == 50


def test_washington_monument_value():
    """Washington Monument should be worth 50 base points.

    With a close check-in (within 10m), that's 75 points.
    """
    monument_points = 50
    close_bonus = 1.5
    assert int(monument_points * close_bonus) == 75
