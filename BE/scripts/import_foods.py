from pathlib import Path

from BE.app.db import SessionLocal
from BE.app.utils.food_loader import import_food_workbooks


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WORKBOOKS = [
    PROJECT_ROOT / "BE" / "Temp" / "india_top_100_carbs_and_100_fats_sources.xlsx",
    PROJECT_ROOT / "BE" / "Temp" / "india_top_100_protein_sources (2).xlsx",
]


def main() -> None:
    missing = [path for path in DEFAULT_WORKBOOKS if not path.exists()]
    if missing:
        missing_paths = ", ".join(str(path) for path in missing)
        raise FileNotFoundError(f"Food workbook(s) not found: {missing_paths}")

    db = SessionLocal()
    try:
        food_count, serving_count = import_food_workbooks(db, DEFAULT_WORKBOOKS)
    finally:
        db.close()
    print(f"Imported {food_count} foods and {serving_count} servings.")


if __name__ == "__main__":
    main()