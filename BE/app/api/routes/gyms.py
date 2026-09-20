import json
import math
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from BE.app.api.deps import get_current_user
from BE.app.db import get_db
from BE.app.models import Booking, Gym, GymSlot, User
from BE.app.schemas import (
    BookingCreate,
    BookingRead,
    GymDetailResponse,
    GymLocation,
    GymNearbyItem,
    GymSlotDate,
    GymSlotItem,
    GymSlotRead,
)

router = APIRouter(tags=["gyms"])


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    rlat1 = math.radians(lat1)
    rlon1 = math.radians(lon1)
    rlat2 = math.radians(lat2)
    rlon2 = math.radians(lon2)

    dlat = rlat2 - rlat1
    dlon = rlon2 - rlon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return 6371.0 * c


def _parse_day_list(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return []


@router.get("/gyms/nearby")
def get_nearby_gyms(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: float = Query(10.0, ge=0.1),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    gyms = db.query(Gym).filter(Gym.status == "active").all()

    items: list[GymNearbyItem] = []
    for gym in gyms:
        if gym.latitude is None or gym.longitude is None:
            continue
        distance = haversine_km(float(lat), float(lng), float(gym.latitude), float(gym.longitude))
        if distance <= radius:
            items.append(
                GymNearbyItem(
                    gym_id=gym.id,
                    name=gym.name,
                    image_url=gym.image_url,
                    distance_km=round(distance, 2),
                )
            )

    items.sort(key=lambda item: item.distance_km)
    return items[offset : offset + limit]


@router.get("/gyms/{gym_id}")
def get_gym_summary(gym_id: int, lat: float | None = Query(default=None), lng: float | None = Query(default=None), db: Session = Depends(get_db)):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if gym is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found")

    distance_km = None
    if lat is not None and lng is not None and gym.latitude is not None and gym.longitude is not None:
        distance_km = round(haversine_km(float(lat), float(lng), float(gym.latitude), float(gym.longitude)), 2)

    payload = {
        "gym_id": gym.id,
        "name": gym.name,
        "image_url": gym.image_url,
        "address": gym.address,
    }
    if distance_km is not None:
        payload["distance_km"] = distance_km
    return payload


@router.get("/gyms/{gym_id}/slots")
def get_gym_slots(
    gym_id: int,
    from_date: str = Query(..., alias="from"),
    to_date: str = Query(..., alias="to"),
    db: Session = Depends(get_db),
):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if gym is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found")

    try:
        start = datetime.strptime(from_date, "%Y-%m-%d").date()
        end = datetime.strptime(to_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Dates must be in YYYY-MM-DD format")

    if end < start:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="to must be after from")

    slots_by_day: list[dict] = []
    current = start
    while current <= end:
        date_value = current.isoformat()
        slot_entries = (
            db.query(GymSlot)
            .filter(GymSlot.gym_id == gym_id, GymSlot.date == date_value)
            .order_by(GymSlot.start_time.asc())
            .all()
        )

        if not slot_entries:
            slot_entries = _generate_slots_for_date(gym, date_value, db)

        entries = []
        for slot in slot_entries:
            booking_count = db.query(func.count(Booking.id)).filter(Booking.slot_id == slot.id).scalar() or 0
            available = booking_count < (gym.max_bookings_per_slot or 1)
            entries.append(
                {
                    "slot_id": slot.id,
                    "start_time": slot.start_time,
                    "end_time": slot.end_time,
                    "available": available,
                }
            )

        slots_by_day.append({"date": date_value, "slots": entries})
        current += timedelta(days=1)

    return {"gym_id": gym.id, "slots": slots_by_day}


@router.get("/gyms/{gym_id}/slots/{slot_id}")
def get_gym_slot_detail(gym_id: int, slot_id: int, db: Session = Depends(get_db)):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if gym is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found")

    slot = db.query(GymSlot).filter(GymSlot.id == slot_id, GymSlot.gym_id == gym_id).first()
    if slot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    return {
        "gym": {
            "gym_id": gym.id,
            "name": gym.name,
            "address": gym.address,
            "image_url": gym.image_url,
        },
        "slot": {
            "slot_id": slot.id,
            "date": slot.date,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
        },
        "maps_url": gym.google_maps_url or f"https://maps.google.com/?q={gym.latitude},{gym.longitude}",
    }


@router.get("/gyms/{gym_id}/details")
def get_gym_details(gym_id: int, db: Session = Depends(get_db)):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if gym is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found")

    return {
        "gym_id": gym.id,
        "name": gym.name,
        "about": gym.about,
        "address": gym.address,
        "location": {
            "latitude": gym.latitude,
            "longitude": gym.longitude,
        },
        "maps_url": gym.google_maps_url or f"https://maps.google.com/?q={gym.latitude},{gym.longitude}",
        "contact": {
            "phone": gym.phone,
            "email": gym.email,
        },
        "timings": {
            "monday": {"open": gym.monday_open, "close": gym.monday_close},
            "tuesday": {"open": gym.tuesday_open, "close": gym.tuesday_close},
            "wednesday": {"open": gym.wednesday_open, "close": gym.wednesday_close},
            "thursday": {"open": gym.thursday_open, "close": gym.thursday_close},
            "friday": {"open": gym.friday_open, "close": gym.friday_close},
            "saturday": {"open": gym.saturday_open, "close": gym.saturday_close},
            "sunday": {"open": gym.sunday_open, "close": gym.sunday_close},
        },
        "equipment": _parse_day_list(gym.equipment_json),
        "photos": _parse_day_list(gym.photos_json),
    }


@router.post("/bookings", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    gym = db.query(Gym).filter(Gym.id == payload.gym_id).first()
    if gym is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found")

    slot = db.query(GymSlot).filter(GymSlot.id == payload.slot_id, GymSlot.gym_id == payload.gym_id).first()
    if slot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    if payload.date != slot.date:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Booking date does not match slot date")

    booking_count = db.query(func.count(Booking.id)).filter(Booking.slot_id == slot.id).scalar() or 0
    if booking_count >= (gym.max_bookings_per_slot or 1):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No slots available for this time")

    booking = Booking(
        user_id=current_user.id,
        gym_id=gym.id,
        slot_id=slot.id,
        date=payload.date,
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return BookingRead(
        booking_id=booking.id,
        status=booking.status,
        gym={"gym_id": gym.id, "name": gym.name},
        date=booking.date,
        start_time=slot.start_time,
        end_time=slot.end_time,
    )


@router.get("/bookings")
def list_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    result = []
    for booking in bookings:
        result.append(
            {
                "booking_id": booking.id,
                "gym": {"gym_id": booking.gym_id, "name": booking.gym.name},
                "date": booking.date,
                "start_time": booking.slot.start_time,
                "end_time": booking.slot.end_time,
                "status": booking.status,
            }
        )
    return result


@router.get("/bookings/{booking_id}")
def get_booking(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == current_user.id).first()
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    return {
        "booking_id": booking.id,
        "status": booking.status,
        "gym": {
            "gym_id": booking.gym.id,
            "name": booking.gym.name,
            "address": booking.gym.address,
            "maps_url": booking.gym.google_maps_url or f"https://maps.google.com/?q={booking.gym.latitude},{booking.gym.longitude}",
        },
        "slot": {
            "date": booking.date,
            "start_time": booking.slot.start_time,
            "end_time": booking.slot.end_time,
        },
    }


@router.delete("/bookings/{booking_id}")
def cancel_booking(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == current_user.id).first()
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    booking.status = "cancelled"
    booking.cancelled_at = datetime.utcnow()
    db.commit()
    return {"booking_id": booking.id, "status": "cancelled"}


def _generate_slots_for_date(gym: Gym, date_value: str, db: Session):
    start = datetime.strptime(date_value, "%Y-%m-%d")
    day_name = start.strftime("%A").lower()
    open_time = getattr(gym, f"{day_name}_open")
    close_time = getattr(gym, f"{day_name}_close")
    if not open_time or not close_time:
        return []

    current = datetime.strptime(f"{date_value} {open_time}", "%Y-%m-%d %H:%M")
    end = datetime.strptime(f"{date_value} {close_time}", "%Y-%m-%d %H:%M")
    slot_duration = timedelta(minutes=gym.slot_duration_minutes or 30)

    results = []
    while current + slot_duration <= end:
        slot_end = current + slot_duration
        slot = GymSlot(
            gym_id=gym.id,
            date=date_value,
            start_time=current.strftime("%H:%M"),
            end_time=slot_end.strftime("%H:%M"),
        )
        db.add(slot)
        db.flush()
        results.append(slot)
        current = slot_end

    db.commit()
    return results
