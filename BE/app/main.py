import json
import logging
import time
import uuid

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from BE.app.api.routes.auth import router as auth_router
from BE.app.api.routes.exercises import router as exercises_router
from BE.app.api.routes.profile import router as profile_router
from BE.app.api.routes.routines import router as routines_router
from BE.app.api.routes.workouts import router as workouts_router
from BE.app.db import SessionLocal, init_db
from BE.app.logging_config import setup_logging
from BE.app.models import Exercise, Routine, User
from BE.app.utils.exercises_loader import load_exercises_data

logger = setup_logging()

app = FastAPI(title="LiftLog API", version="0.1.0")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = uuid.uuid4().hex[:12]
    start = time.perf_counter()
    body = await request.body()
    request_body = body.decode("utf-8", errors="replace") if body else ""

    try:
        request_json = json.loads(request_body) if request_body else None
    except json.JSONDecodeError:
        request_json = request_body

    safe_headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"authorization", "cookie", "set-cookie"}
    }

    logger.info(
        "REQUEST START request_id=%s method=%s path=%s query=%s headers=%s body=%s",
        request_id,
        request.method,
        request.url.path,
        dict(request.query_params),
        safe_headers,
        request_json,
    )

    try:
        response = await call_next(request)
        response_body = b""
        async for chunk in response.body_iterator:
            response_body += chunk

        payload = response_body.decode("utf-8", errors="replace") if response_body else ""
        try:
            payload_json = json.loads(payload) if payload else None
        except json.JSONDecodeError:
            payload_json = payload

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            "REQUEST END request_id=%s method=%s path=%s status=%s elapsed_ms=%s response=%s",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
            payload_json[:2000] if isinstance(payload_json, str) else payload_json,
        )

        return Response(
            content=response_body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )
    except Exception as exc:  # pragma: no cover
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception(
            "REQUEST FAILED request_id=%s method=%s path=%s query=%s body=%s elapsed_ms=%s",
            request_id,
            request.method,
            request.url.path,
            dict(request.query_params),
            request_json,
            elapsed_ms,
        )
        raise

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(exercises_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")
app.include_router(routines_router, prefix="/api/v1")
app.include_router(workouts_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "LiftLog API"}


@app.on_event("startup")
def startup_event() -> None:
    logger.info("Starting LiftLog API")
    init_db()
    seed_demo_data()
    logger.info("LiftLog API startup complete")


def seed_demo_data() -> None:
    db: Session = SessionLocal()
    try:
        if not db.query(User).first():
            demo_user = User(email="demo@liftlog.app", full_name="Demo User", auth_provider="demo")
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        else:
            demo_user = db.query(User).filter(User.email == "demo@liftlog.app").first()

        # Load exercises from FE/exercises-data.js
        exercises_data = load_exercises_data()
        
        if exercises_data:
            for exercise_data in exercises_data:
                if not db.query(Exercise).filter(Exercise.id == exercise_data['id']).first():
                    db.add(Exercise(id=exercise_data['id'], name=exercise_data['name']))
            db.commit()
            logger.info(f"Seeded {len(exercises_data)} exercises from exercises-data.js")
        else:
            # Fallback to basic exercises if exercises-data.js not found
            default_exercises = [
                "Bench Press",
                "Incline DB Press",
                "Cable Fly",
                "Shoulder Press",
                "Lateral Raise",
                "Squat",
                "Deadlift",
                "Leg Press",
            ]
            for name in default_exercises:
                if not db.query(Exercise).filter(Exercise.name == name).first():
                    db.add(Exercise(name=name))
            db.commit()
            logger.info("Seeded fallback exercises")

        if demo_user and not db.query(Routine).filter(Routine.user_id == demo_user.id).first():
            push_day = Routine(user_id=demo_user.id, name="Push Day")
            legs = Routine(user_id=demo_user.id, name="Legs")
            db.add_all([push_day, legs])
            db.commit()
    finally:
        db.close()
