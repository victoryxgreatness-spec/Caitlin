from fastapi import APIRouter, Depends, HTTPException, Query
from geoalchemy2.functions import ST_DWithin, ST_Distance, ST_MakePoint, ST_SetSRID
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationResponse, NearbyLocationResponse

router = APIRouter(prefix="/locations", tags=["locations"])


@router.post("/", response_model=LocationResponse, status_code=201)
def create_location(loc: LocationCreate, db: Session = Depends(get_db)):
    """Add a new location to the map."""
    # Build the PostGIS geography point from lat/lng
    point = f"SRID=4326;POINT({loc.longitude} {loc.latitude})"

    location = Location(
        name=loc.name,
        description=loc.description,
        latitude=loc.latitude,
        longitude=loc.longitude,
        coords=point,
        point_value=loc.point_value,
        category=loc.category,
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


@router.get("/", response_model=list[LocationResponse])
def list_locations(
    category: str | None = None,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    """List locations, optionally filtered by category."""
    query = db.query(Location)
    if category:
        query = query.filter(Location.category == category)
    return query.limit(limit).all()


@router.get("/nearby", response_model=list[NearbyLocationResponse])
def nearby_locations(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_meters: float = Query(default=5000, le=50000),
    db: Session = Depends(get_db),
):
    """Find locations within a given radius of a point.

    This is the core spatial query — powered by PostGIS.
    """
    user_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)

    # Find all locations within radius, ordered by distance
    locations = (
        db.query(
            Location,
            ST_Distance(Location.coords, user_point).label("distance_meters"),
        )
        .filter(ST_DWithin(Location.coords, user_point, radius_meters))
        .order_by("distance_meters")
        .all()
    )

    return [
        NearbyLocationResponse(
            id=loc.id,
            name=loc.name,
            description=loc.description,
            latitude=loc.latitude,
            longitude=loc.longitude,
            point_value=loc.point_value,
            category=loc.category,
            created_at=loc.created_at,
            distance_meters=round(dist, 1),
        )
        for loc, dist in locations
    ]


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(location_id: int, db: Session = Depends(get_db)):
    """Get a specific location by ID."""
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location
