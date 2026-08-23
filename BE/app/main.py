from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from BE.app.api.routes.auth import router as auth_router
from BE.app.api.routes.routines import router as routines_router
from BE.app.api.routes.workouts import router as workouts_router
from BE.app.db import SessionLocal, init_db
from BE.app.models import Exercise, Routine, User

app = FastAPI(title="LiftLog API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(routines_router, prefix="/api/v1")
app.include_router(workouts_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "LiftLog API"}


@app.on_event("startup")
def startup_event() -> None:
    init_db()
    seed_demo_data()


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
                db.add(Exercise(name=name, created_by=None, is_custom=False))
        db.commit()

        if demo_user and not db.query(Routine).filter(Routine.user_id == demo_user.id).first():
            push_day = Routine(user_id=demo_user.id, name="Push Day")
            legs = Routine(user_id=demo_user.id, name="Legs")
            db.add_all([push_day, legs])
            db.commit()
    finally:
        db.close()
