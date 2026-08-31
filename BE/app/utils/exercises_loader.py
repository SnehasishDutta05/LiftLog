import json
import re
from pathlib import Path


def load_exercises_data():
    """Load exercises from FE/exercises-data.js"""
    try:
        file_path = Path(__file__).resolve().parents[3] / "FE" / "exercises-data.js"
        
        if not file_path.exists():
            print(f"Exercises data file not found: {file_path}")
            return []

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract the array content from export const EXDB=[...];
        match = re.search(r'export\s+const\s+EXDB=(\[.*?\]);', content, re.DOTALL)
        if not match:
            print("Could not find EXDB export in exercises-data.js")
            return []

        json_str = match.group(1)
        exercises = json.loads(json_str)

        # Transform to match our schema: id -> exercise_id, n -> name
        result = []
        for ex in exercises:
            result.append({
                'id': int(ex.get('id', 0)),
                'name': ex.get('n', ''),
            })

        return result

    except Exception as e:
        print(f"Error loading exercises data: {e}")
        return []
