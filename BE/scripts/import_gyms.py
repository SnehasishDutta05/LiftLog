from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from openpyxl import Workbook, load_workbook
from sqlalchemy.orm import Session

from BE.app.db import SessionLocal, init_db
from BE.app.models import Gym

PROJECT_ROOT = Path(__file__).resolve().parents[2]
WORKBOOK_PATH = PROJECT_ROOT / "BE" / "Temp" / "gym_seed_data.xlsx"

HEADERS = [
    "name",
    "about",
    "status",
    "address",
    "city",
    "state",
    "pincode",
    "latitude",
    "longitude",
    "google_maps_url",
    "phone",
    "email",
    "image_url",
    "monday_open",
    "monday_close",
    "tuesday_open",
    "tuesday_close",
    "wednesday_open",
    "wednesday_close",
    "thursday_open",
    "thursday_close",
    "friday_open",
    "friday_close",
    "saturday_open",
    "saturday_close",
    "sunday_open",
    "sunday_close",
    "equipment_json",
    "photos_json",
    "slot_duration_minutes",
    "max_bookings_per_slot",
]


def build_seed_rows() -> list[dict[str, Any]]:
    return [
        {
            "name": "IronCore Fitness",
            "about": "Premium fitness center with strength, cardio and functional training facilities.",
            "status": "active",
            "address": "Action Area 1, New Town, Kolkata",
            "city": "Kolkata",
            "state": "West Bengal",
            "pincode": "700156",
            "latitude": 22.5958,
            "longitude": 88.4797,
            "google_maps_url": "https://maps.google.com/?q=22.5958,88.4797",
            "phone": "+91 90000 00001",
            "email": "contact@ironcorefitness.com",
            "image_url": "https://cdn.liftlog.com/gyms/ironcore/main.jpg",
            "monday_open": "06:00",
            "monday_close": "22:00",
            "tuesday_open": "06:00",
            "tuesday_close": "22:00",
            "wednesday_open": "06:00",
            "wednesday_close": "22:00",
            "thursday_open": "06:00",
            "thursday_close": "22:00",
            "friday_open": "06:00",
            "friday_close": "22:00",
            "saturday_open": "07:00",
            "saturday_close": "20:00",
            "sunday_open": "08:00",
            "sunday_close": "18:00",
            "equipment_json": json.dumps(["Treadmill", "Squat Rack", "Bench Press", "Cable Machine", "Dumbbells", "Leg Press"]),
            "photos_json": json.dumps(["https://cdn.liftlog.com/gyms/ironcore/1.jpg", "https://cdn.liftlog.com/gyms/ironcore/2.jpg", "https://cdn.liftlog.com/gyms/ironcore/3.jpg"]),
            "slot_duration_minutes": 30,
            "max_bookings_per_slot": 3,
        },
        {
            "name": "FitZone New Town",
            "about": "Modern gym focused on strength training, fat loss and wellness coaching.",
            "status": "active",
            "address": "DF Block, New Town, Kolkata",
            "city": "Kolkata",
            "state": "West Bengal",
            "pincode": "700165",
            "latitude": 22.5785,
            "longitude": 88.4343,
            "google_maps_url": "https://maps.google.com/?q=22.5785,88.4343",
            "phone": "+91 90000 00002",
            "email": "hello@fitzonenewtown.com",
            "image_url": "https://cdn.liftlog.com/gyms/fitzone/main.jpg",
            "monday_open": "05:30",
            "monday_close": "22:30",
            "tuesday_open": "05:30",
            "tuesday_close": "22:30",
            "wednesday_open": "05:30",
            "wednesday_close": "22:30",
            "thursday_open": "05:30",
            "thursday_close": "22:30",
            "friday_open": "05:30",
            "friday_close": "22:30",
            "saturday_open": "06:00",
            "saturday_close": "21:00",
            "sunday_open": "07:00",
            "sunday_close": "19:00",
            "equipment_json": json.dumps(["Treadmill", "Smith Machine", "Cable Machine", "Battle Ropes", "Dumbbells"]),
            "photos_json": json.dumps(["https://cdn.liftlog.com/gyms/fitzone/1.jpg", "https://cdn.liftlog.com/gyms/fitzone/2.jpg"]),
            "slot_duration_minutes": 30,
            "max_bookings_per_slot": 2,
        },
        {
            "name": "Pulse Strength Studio",
            "about": "Strength-first studio for bodybuilders and athletes seeking guided training.",
            "status": "active",
            "address": "Salt Lake Sector V, Kolkata",
            "city": "Kolkata",
            "state": "West Bengal",
            "pincode": "700091",
            "latitude": 22.5677,
            "longitude": 88.4572,
            "google_maps_url": "https://maps.google.com/?q=22.5677,88.4572",
            "phone": "+91 90000 00003",
            "email": "bookings@pulsestrength.com",
            "image_url": "https://cdn.liftlog.com/gyms/pulse/main.jpg",
            "monday_open": "06:00",
            "monday_close": "21:30",
            "tuesday_open": "06:00",
            "tuesday_close": "21:30",
            "wednesday_open": "06:00",
            "wednesday_close": "21:30",
            "thursday_open": "06:00",
            "thursday_close": "21:30",
            "friday_open": "06:00",
            "friday_close": "21:30",
            "saturday_open": "07:00",
            "saturday_close": "18:00",
            "sunday_open": "08:00",
            "sunday_close": "16:00",
            "equipment_json": json.dumps(["Deadlift Platform", "Power Rack", "Rowing Machine", "Kettlebells", "Pull-Up Bar"]),
            "photos_json": json.dumps(["https://cdn.liftlog.com/gyms/pulse/1.jpg", "https://cdn.liftlog.com/gyms/pulse/2.jpg"]),
            "slot_duration_minutes": 60,
            "max_bookings_per_slot": 2,
        },
        {
            "name": "Beast Mode Gym",
            "about": "High-energy gym for powerlifting, conditioning and athletic performance.",
            "status": "active",
            "address": "Bidhannagar, Kolkata",
            "city": "Kolkata",
            "state": "West Bengal",
            "pincode": "700064",
            "latitude": 22.6112,
            "longitude": 88.4309,
            "google_maps_url": "https://maps.google.com/?q=22.6112,88.4309",
            "phone": "+91 90000 00004",
            "email": "support@beastmodegym.com",
            "image_url": "https://cdn.liftlog.com/gyms/beastmode/main.jpg",
            "monday_open": "05:00",
            "monday_close": "23:00",
            "tuesday_open": "05:00",
            "tuesday_close": "23:00",
            "wednesday_open": "05:00",
            "wednesday_close": "23:00",
            "thursday_open": "05:00",
            "thursday_close": "23:00",
            "friday_open": "05:00",
            "friday_close": "23:00",
            "saturday_open": "06:00",
            "saturday_close": "22:00",
            "sunday_open": "07:00",
            "sunday_close": "20:00",
            "equipment_json": json.dumps(["Barbell", "Power Rack", "Bench Press", "Cable Machine", "Rowing Machine"]),
            "photos_json": json.dumps(["https://cdn.liftlog.com/gyms/beastmode/1.jpg", "https://cdn.liftlog.com/gyms/beastmode/2.jpg", "https://cdn.liftlog.com/gyms/beastmode/3.jpg"]),
            "slot_duration_minutes": 30,
            "max_bookings_per_slot": 3,
        },
        {
            "name": "Prime Performance Club",
            "about": "Lifestyle fitness club with personal training and premium workout zones.",
            "status": "active",
            "address": "EM Bypass, Kolkata",
            "city": "Kolkata",
            "state": "West Bengal",
            "pincode": "700078",
            "latitude": 22.5216,
            "longitude": 88.3684,
            "google_maps_url": "https://maps.google.com/?q=22.5216,88.3684",
            "phone": "+91 90000 00005",
            "email": "frontdesk@primeperformanceclub.com",
            "image_url": "https://cdn.liftlog.com/gyms/prime/main.jpg",
            "monday_open": "06:00",
            "monday_close": "22:00",
            "tuesday_open": "06:00",
            "tuesday_close": "22:00",
            "wednesday_open": "06:00",
            "wednesday_close": "22:00",
            "thursday_open": "06:00",
            "thursday_close": "22:00",
            "friday_open": "06:00",
            "friday_close": "22:00",
            "saturday_open": "07:00",
            "saturday_close": "20:00",
            "sunday_open": "08:00",
            "sunday_close": "18:00",
            "equipment_json": json.dumps(["Treadmill", "Leg Press", "Bench Press", "Cable Machine", "Spin Bikes"]),
            "photos_json": json.dumps(["https://cdn.liftlog.com/gyms/prime/1.jpg", "https://cdn.liftlog.com/gyms/prime/2.jpg"]),
            "slot_duration_minutes": 30,
            "max_bookings_per_slot": 2,
        },
        {
            "name": "Urban Edge Fitness",
            "about": "Compact but complete gym with cardio and strength support for busy professionals.",
            "status": "active",
            "address": "Garia, Kolkata",
            "city": "Kolkata",
            "state": "West Bengal",
            "pincode": "700084",
            "latitude": 22.5489,
            "longitude": 88.3831,
            "google_maps_url": "https://maps.google.com/?q=22.5489,88.3831",
            "phone": "+91 90000 00006",
            "email": "info@urbanedgefitness.in",
            "image_url": "https://cdn.liftlog.com/gyms/urbanedge/main.jpg",
            "monday_open": "06:30",
            "monday_close": "22:00",
            "tuesday_open": "06:30",
            "tuesday_close": "22:00",
            "wednesday_open": "06:30",
            "wednesday_close": "22:00",
            "thursday_open": "06:30",
            "thursday_close": "22:00",
            "friday_open": "06:30",
            "friday_close": "22:00",
            "saturday_open": "07:00",
            "saturday_close": "19:00",
            "sunday_open": "08:00",
            "sunday_close": "17:00",
            "equipment_json": json.dumps(["Elliptical", "Dumbbells", "Bench Press", "Treadmill", "Cable Machine"]),
            "photos_json": json.dumps(["https://cdn.liftlog.com/gyms/urbanedge/1.jpg", "https://cdn.liftlog.com/gyms/urbanedge/2.jpg"]),
            "slot_duration_minutes": 30,
            "max_bookings_per_slot": 3,
        },
        {
            "name": "CrossFit Kolkata",
            "about": "Functional fitness club with arrt conditioning, strength and agility training.",
            "status": "active",
            "address": "Bansdroni, Kolkata",
            "city": "Kolkata",
            "state": "West Bengal",
            "pincode": "700070",
            "latitude": 22.6475,
            "longitude": 88.3702,
            "google_maps_url": "https://maps.google.com/?q=22.6475,88.3702",
            "phone": "+91 90000 00007",
            "email": "hello@crossfitkolkata.com",
            "image_url": "https://cdn.liftlog.com/gyms/crossfit/main.jpg",
            "monday_open": "06:00",
            "monday_close": "21:00",
            "tuesday_open": "06:00",
            "tuesday_close": "21:00",
            "wednesday_open": "06:00",
            "wednesday_close": "21:00",
            "thursday_open": "06:00",
            "thursday_close": "21:00",
            "friday_open": "06:00",
            "friday_close": "21:00",
            "saturday_open": "07:00",
            "saturday_close": "18:00",
            "sunday_open": "08:00",
            "sunday_close": "16:00",
            "equipment_json": json.dumps(["Kettlebells", "Pull-Up Bar", "Box Jumps", "Rowing Machine", "Medicine Balls"]),
            "photos_json": json.dumps(["https://cdn.liftlog.com/gyms/crossfit/1.jpg", "https://cdn.liftlog.com/gyms/crossfit/2.jpg"]),
            "slot_duration_minutes": 60,
            "max_bookings_per_slot": 2,
        },
        {
            "name": "Metro Muscle House",
            "about": "Full-body conditioning and strength training in a premium urban setup.",
            "status": "active",
            "address": "Howrah, Kolkata",
            "city": "Kolkata",
            "state": "West Bengal",
            "pincode": "711101",
            "latitude": 22.4966,
            "longitude": 88.3467,
            "google_maps_url": "https://maps.google.com/?q=22.4966,88.3467",
            "phone": "+91 90000 00008",
            "email": "membership@metromusclehouse.com",
            "image_url": "https://cdn.liftlog.com/gyms/metromuscle/main.jpg",
            "monday_open": "05:30",
            "monday_close": "22:30",
            "tuesday_open": "05:30",
            "tuesday_close": "22:30",
            "wednesday_open": "05:30",
            "wednesday_close": "22:30",
            "thursday_open": "05:30",
            "thursday_close": "22:30",
            "friday_open": "05:30",
            "friday_close": "22:30",
            "saturday_open": "06:00",
            "saturday_close": "21:00",
            "sunday_open": "07:00",
            "sunday_close": "18:00",
            "equipment_json": json.dumps(["TRX", "Treadmill", "Bench Press", "Cable Machine", "Kettlebells"]),
            "photos_json": json.dumps(["https://cdn.liftlog.com/gyms/metromuscle/1.jpg", "https://cdn.liftlog.com/gyms/metromuscle/2.jpg"]),
            "slot_duration_minutes": 30,
            "max_bookings_per_slot": 2,
        },
        {
            "name": "PowerHouse Gym",
            "about": "Performance-oriented gym with cardio, lifting and functional training zones.",
            "status": "active",
            "address": "Kasba, Kolkata",
            "city": "Kolkata",
            "state": "West Bengal",
            "pincode": "700042",
            "latitude": 22.6032,
            "longitude": 88.4937,
            "google_maps_url": "https://maps.google.com/?q=22.6032,88.4937",
            "phone": "+91 90000 00009",
            "email": "care@powerhousegym.co.in",
            "image_url": "https://cdn.liftlog.com/gyms/powerhouse/main.jpg",
            "monday_open": "05:00",
            "monday_close": "23:00",
            "tuesday_open": "05:00",
            "tuesday_close": "23:00",
            "wednesday_open": "05:00",
            "wednesday_close": "23:00",
            "thursday_open": "05:00",
            "thursday_close": "23:00",
            "friday_open": "05:00",
            "friday_close": "23:00",
            "saturday_open": "06:00",
            "saturday_close": "22:00",
            "sunday_open": "07:00",
            "sunday_close": "20:00",
            "equipment_json": json.dumps(["Power Rack", "Treadmill", "Leg Press", "Bench Press", "Cable Machine"]),
            "photos_json": json.dumps(["https://cdn.liftlog.com/gyms/powerhouse/1.jpg", "https://cdn.liftlog.com/gyms/powerhouse/2.jpg", "https://cdn.liftlog.com/gyms/powerhouse/3.jpg"]),
            "slot_duration_minutes": 30,
            "max_bookings_per_slot": 4,
        },
        {
            "name": "Elevate Athletic Center",
            "about": "Athletic performance center for strength, mobility and endurance training.",
            "status": "active",
            "address": "Tollygunge, Kolkata",
            "city": "Kolkata",
            "state": "West Bengal",
            "pincode": "700033",
            "latitude": 22.5721,
            "longitude": 88.5033,
            "google_maps_url": "https://maps.google.com/?q=22.5721,88.5033",
            "phone": "+91 90000 00010",
            "email": "hello@elevateathleticcenter.com",
            "image_url": "https://cdn.liftlog.com/gyms/elevate/main.jpg",
            "monday_open": "06:00",
            "monday_close": "22:00",
            "tuesday_open": "06:00",
            "tuesday_close": "22:00",
            "wednesday_open": "06:00",
            "wednesday_close": "22:00",
            "thursday_open": "06:00",
            "thursday_close": "22:00",
            "friday_open": "06:00",
            "friday_close": "22:00",
            "saturday_open": "07:00",
            "saturday_close": "20:00",
            "sunday_open": "08:00",
            "sunday_close": "18:00",
            "equipment_json": json.dumps(["Treadmill", "Squat Rack", "Bench Press", "Dumbbells", "Medicine Balls"]),
            "photos_json": json.dumps(["https://cdn.liftlog.com/gyms/elevate/1.jpg", "https://cdn.liftlog.com/gyms/elevate/2.jpg"]),
            "slot_duration_minutes": 30,
            "max_bookings_per_slot": 2,
        },
    ]


def ensure_workbook(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Gyms"
    sheet.append(HEADERS)
    for row in build_seed_rows():
        sheet.append([row.get(header) for header in HEADERS])
    workbook.save(path)
    print(f"Created gym workbook at {path}")


def load_rows(path: Path) -> list[dict[str, Any]]:
    workbook = load_workbook(path, read_only=True, data_only=True)
    sheet = workbook["Gyms"]
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return []
    headers = [str(value).strip() for value in rows[0]]
    data_rows: list[dict[str, Any]] = []
    for values in rows[1:]:
        row = {headers[index]: values[index] for index in range(len(headers))}
        data_rows.append(row)
    return data_rows


def sync_gyms_to_db(db: Session) -> int:
    from BE.app.models import Booking, GymSlot

    db.query(Booking).delete()
    db.query(GymSlot).delete()
    db.query(Gym).delete()
    db.commit()

    imported = 0
    for row in load_rows(WORKBOOK_PATH):
        name = str(row.get("name", "")).strip()
        if not name:
            continue

        gym = Gym(name=name)
        db.add(gym)
        imported += 1

        gym.about = row.get("about") or gym.about
        gym.status = row.get("status") or gym.status or "active"
        gym.address = row.get("address") or gym.address
        gym.city = row.get("city") or gym.city
        gym.state = row.get("state") or gym.state
        gym.pincode = row.get("pincode") or gym.pincode
        gym.latitude = float(row.get("latitude") or gym.latitude or 0)
        gym.longitude = float(row.get("longitude") or gym.longitude or 0)
        gym.google_maps_url = row.get("google_maps_url") or gym.google_maps_url
        gym.phone = row.get("phone") or gym.phone
        gym.email = row.get("email") or gym.email
        gym.image_url = row.get("image_url") or gym.image_url
        gym.monday_open = row.get("monday_open") or gym.monday_open
        gym.monday_close = row.get("monday_close") or gym.monday_close
        gym.tuesday_open = row.get("tuesday_open") or gym.tuesday_open
        gym.tuesday_close = row.get("tuesday_close") or gym.tuesday_close
        gym.wednesday_open = row.get("wednesday_open") or gym.wednesday_open
        gym.wednesday_close = row.get("wednesday_close") or gym.wednesday_close
        gym.thursday_open = row.get("thursday_open") or gym.thursday_open
        gym.thursday_close = row.get("thursday_close") or gym.thursday_close
        gym.friday_open = row.get("friday_open") or gym.friday_open
        gym.friday_close = row.get("friday_close") or gym.friday_close
        gym.saturday_open = row.get("saturday_open") or gym.saturday_open
        gym.saturday_close = row.get("saturday_close") or gym.saturday_close
        gym.sunday_open = row.get("sunday_open") or gym.sunday_open
        gym.sunday_close = row.get("sunday_close") or gym.sunday_close
        gym.equipment_json = row.get("equipment_json") or gym.equipment_json
        gym.photos_json = row.get("photos_json") or gym.photos_json
        gym.slot_duration_minutes = int(row.get("slot_duration_minutes") or gym.slot_duration_minutes or 30)
        gym.max_bookings_per_slot = int(row.get("max_bookings_per_slot") or gym.max_bookings_per_slot or 1)

    db.commit()
    return imported


def main() -> None:
    init_db()
    ensure_workbook(WORKBOOK_PATH)

    db = SessionLocal()
    try:
        imported = sync_gyms_to_db(db)
        print(f"Synced {imported} new gyms from workbook to the database.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
