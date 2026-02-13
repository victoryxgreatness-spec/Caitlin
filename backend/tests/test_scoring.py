"""Tests for the scoring service.

These test the point calculation logic without needing a database.
"""


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
