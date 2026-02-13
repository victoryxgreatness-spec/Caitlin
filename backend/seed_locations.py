"""Seed script to populate the database with notable locations and achievements.

Run with: python -m seed_locations
Requires the database to exist and tables to be created.
"""

SEED_LOCATIONS = [
    # Washington D.C.
    {
        "name": "Washington Monument",
        "description": "555-foot marble obelisk honoring George Washington",
        "latitude": 38.8895,
        "longitude": -77.0353,
        "point_value": 50,
        "category": "monument",
    },
    {
        "name": "Lincoln Memorial",
        "description": "Iconic memorial to the 16th President",
        "latitude": 38.8893,
        "longitude": -77.0502,
        "point_value": 50,
        "category": "monument",
    },
    {
        "name": "National Mall",
        "description": "America's front yard — the big lawn between monuments",
        "latitude": 38.8899,
        "longitude": -77.0228,
        "point_value": 30,
        "category": "park",
    },
    # New York City
    {
        "name": "Central Park",
        "description": "843 acres of grass to touch in Manhattan",
        "latitude": 40.7829,
        "longitude": -73.9654,
        "point_value": 40,
        "category": "park",
    },
    {
        "name": "Statue of Liberty",
        "description": "Lady Liberty herself — hard to reach, big reward",
        "latitude": 40.6892,
        "longitude": -74.0445,
        "point_value": 75,
        "category": "monument",
    },
    {
        "name": "Brooklyn Bridge",
        "description": "Walk across this iconic 1883 bridge",
        "latitude": 40.7061,
        "longitude": -73.9969,
        "point_value": 35,
        "category": "landmark",
    },
    # San Francisco
    {
        "name": "Golden Gate Bridge",
        "description": "The most photographed bridge in the world",
        "latitude": 37.8199,
        "longitude": -122.4783,
        "point_value": 60,
        "category": "landmark",
    },
    {
        "name": "Golden Gate Park",
        "description": "1,017 acres of urban park — more grass than Central Park",
        "latitude": 37.7694,
        "longitude": -122.4862,
        "point_value": 35,
        "category": "park",
    },
    # Chicago
    {
        "name": "Millennium Park",
        "description": "Home of the Bean (Cloud Gate)",
        "latitude": 41.8826,
        "longitude": -87.6226,
        "point_value": 40,
        "category": "park",
    },
    # Nature / National Parks
    {
        "name": "Grand Canyon South Rim",
        "description": "One of the seven natural wonders of the world",
        "latitude": 36.0544,
        "longitude": -112.1401,
        "point_value": 100,
        "category": "nature",
    },
    {
        "name": "Yellowstone Old Faithful",
        "description": "The world's most famous geyser",
        "latitude": 44.4605,
        "longitude": -110.8281,
        "point_value": 100,
        "category": "nature",
    },
    {
        "name": "Yosemite Valley",
        "description": "Granite cliffs, waterfalls, and giant sequoias",
        "latitude": 37.7456,
        "longitude": -119.5936,
        "point_value": 100,
        "category": "nature",
    },
]

SEED_ACHIEVEMENTS = [
    # Getting started
    {
        "name": "First Steps",
        "description": "Complete your first check-in. Everyone starts somewhere!",
        "icon": "footprints",
        "category": "general",
        "requirement_type": "total_checkins",
        "requirement_value": 1,
        "bonus_points": 10,
    },
    {
        "name": "Getting Outside",
        "description": "Check in at 5 different locations",
        "icon": "sun",
        "category": "general",
        "requirement_type": "unique_locations",
        "requirement_value": 5,
        "bonus_points": 50,
    },
    {
        "name": "Grass Enthusiast",
        "description": "Complete 25 total check-ins",
        "icon": "seedling",
        "category": "general",
        "requirement_type": "total_checkins",
        "requirement_value": 25,
        "bonus_points": 100,
    },
    {
        "name": "Grass Connoisseur",
        "description": "Visit 25 unique locations",
        "icon": "herb",
        "category": "general",
        "requirement_type": "unique_locations",
        "requirement_value": 25,
        "bonus_points": 250,
    },
    {
        "name": "Touched All The Grass",
        "description": "Complete 100 total check-ins. You are one with the grass.",
        "icon": "trophy",
        "category": "general",
        "requirement_type": "total_checkins",
        "requirement_value": 100,
        "bonus_points": 500,
    },
    # Category-specific
    {
        "name": "Park Ranger",
        "description": "Check in at 5 parks",
        "icon": "tree",
        "category": "park",
        "requirement_type": "category_checkins",
        "requirement_value": 5,
        "bonus_points": 75,
    },
    {
        "name": "Monument Maven",
        "description": "Check in at 5 monuments",
        "icon": "landmark",
        "category": "monument",
        "requirement_type": "category_checkins",
        "requirement_value": 5,
        "bonus_points": 75,
    },
    {
        "name": "Nature Lover",
        "description": "Check in at 3 nature locations",
        "icon": "mountain",
        "category": "nature",
        "requirement_type": "category_checkins",
        "requirement_value": 3,
        "bonus_points": 150,
    },
    # Points milestones
    {
        "name": "Centurion",
        "description": "Accumulate 100 total points",
        "icon": "star",
        "category": "general",
        "requirement_type": "points_total",
        "requirement_value": 100,
        "bonus_points": 25,
    },
    {
        "name": "High Roller",
        "description": "Accumulate 1,000 total points",
        "icon": "fire",
        "category": "general",
        "requirement_type": "points_total",
        "requirement_value": 1000,
        "bonus_points": 100,
    },
]


def seed(db_session):
    """Insert seed data into the database."""
    from app.models.achievement import Achievement
    from app.models.location import Location

    # Seed locations
    for loc_data in SEED_LOCATIONS:
        point = f"SRID=4326;POINT({loc_data['longitude']} {loc_data['latitude']})"
        location = Location(coords=point, **loc_data)
        db_session.add(location)

    # Seed achievements
    for ach_data in SEED_ACHIEVEMENTS:
        achievement = Achievement(**ach_data)
        db_session.add(achievement)

    db_session.commit()
    print(f"Seeded {len(SEED_LOCATIONS)} locations and {len(SEED_ACHIEVEMENTS)} achievements.")


if __name__ == "__main__":
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
