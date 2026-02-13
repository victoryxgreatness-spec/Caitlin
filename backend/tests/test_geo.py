"""Tests for the geolocation service."""

from app.services.geo import calculate_distance_meters


def test_same_point_distance_is_zero():
    """Two identical coordinates should be 0 meters apart."""
    distance = calculate_distance_meters(38.8895, -77.0353, 38.8895, -77.0353)
    assert distance == 0.0


def test_washington_monument_to_lincoln_memorial():
    """Washington Monument to Lincoln Memorial is roughly 1km.

    Washington Monument: 38.8895, -77.0353
    Lincoln Memorial:    38.8893, -77.0502
    """
    distance = calculate_distance_meters(38.8895, -77.0353, 38.8893, -77.0502)
    # Should be approximately 1.2km
    assert 1000 < distance < 1500


def test_close_proximity():
    """Two points 30 meters apart should register as close."""
    # ~30m apart (roughly 0.0003 degrees latitude)
    distance = calculate_distance_meters(38.8895, -77.0353, 38.8898, -77.0353)
    assert 20 < distance < 50


def test_new_york_to_la():
    """Cross-country distance should be roughly 3,950km."""
    # NYC: 40.7128, -74.0060
    # LA:  34.0522, -118.2437
    distance = calculate_distance_meters(40.7128, -74.0060, 34.0522, -118.2437)
    assert 3_900_000 < distance < 4_000_000
