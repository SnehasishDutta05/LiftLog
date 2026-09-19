from __future__ import annotations

from datetime import datetime
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

from sqlalchemy.orm import Session

from BE.app.models import Food, FoodServing


EXCEL_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
DATA_HEADERS = {
    "food",
    "calories_per_100",
    "protein_per_100",
    "carbs_per_100",
    "fats_per_100",
    "common_measured_unit1",
    "weight1",
}


def _column_index(cell_reference: str) -> int:
    column = "".join(character for character in cell_reference if character.isalpha())
    index = 0
    for character in column:
        index = index * 26 + ord(character.upper()) - ord("A") + 1
    return index - 1


def _read_cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    value = cell.find(f"{{{EXCEL_NS}}}v")
    text = "" if value is None else value.text or ""
    if cell.attrib.get("t") == "s" and text:
        return shared_strings[int(text)]
    if cell.attrib.get("t") == "inlineStr":
        return "".join(node.text or "" for node in cell.findall(f".//{{{EXCEL_NS}}}t"))
    return text


def _workbook_rows(workbook_path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with ZipFile(workbook_path) as workbook:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in workbook.namelist():
            shared_root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
            shared_strings = [
                "".join(node.text or "" for node in item.findall(f".//{{{EXCEL_NS}}}t"))
                for item in shared_root.findall(f"{{{EXCEL_NS}}}si")
            ]

        workbook_root = ET.fromstring(workbook.read("xl/workbook.xml"))
        relationships_root = ET.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
        relationships = {
            relationship.attrib["Id"]: relationship.attrib["Target"].lstrip("/")
            for relationship in relationships_root
        }

        for sheet in workbook_root.findall(f".//{{{EXCEL_NS}}}sheet"):
            relationship_id = sheet.attrib[f"{{{REL_NS}}}id"]
            worksheet_path = relationships[relationship_id]
            if not worksheet_path.startswith("xl/"):
                worksheet_path = f"xl/{worksheet_path}"
            worksheet_root = ET.fromstring(workbook.read(worksheet_path))
            worksheet_rows = worksheet_root.findall(f".//{{{EXCEL_NS}}}sheetData/{{{EXCEL_NS}}}row")
            if not worksheet_rows:
                continue

            header_cells = worksheet_rows[0].findall(f"{{{EXCEL_NS}}}c")
            headers_by_index = {
                _column_index(cell.attrib["r"]): _read_cell_value(cell, shared_strings).strip()
                for cell in header_cells
            }
            headers = [headers_by_index[index] for index in range(max(headers_by_index) + 1)]
            if not DATA_HEADERS.issubset(headers):
                continue

            for row in worksheet_rows[1:]:
                values_by_index = {
                    _column_index(cell.attrib["r"]): _read_cell_value(cell, shared_strings).strip()
                    for cell in row.findall(f"{{{EXCEL_NS}}}c")
                }
                values = [values_by_index.get(index, "") for index in range(len(headers))]
                rows.append(dict(zip(headers, values)))
    return rows


def _number(value: str, field_name: str) -> float:
    try:
        return float(value)
    except ValueError as exc:
        raise ValueError(f"Invalid {field_name} value: {value!r}") from exc


def import_food_workbooks(db: Session, workbook_paths: list[Path]) -> tuple[int, int]:
    food_rows: dict[str, dict[str, str]] = {}
    for workbook_path in workbook_paths:
        for row in _workbook_rows(workbook_path):
            name = row.get("food", "").strip()
            if name:
                food_rows.setdefault(name.casefold(), row)

    imported_foods = 0
    imported_servings = 0
    for row in food_rows.values():
        name = row["food"].strip()
        food = db.query(Food).filter(Food.name == name).first()
        if food is None:
            food = Food(name=name)
            db.add(food)
            imported_foods += 1

        food.calories_per_100g = _number(row["calories_per_100"], "calories_per_100")
        food.protein_per_100g = _number(row["protein_per_100"], "protein_per_100")
        food.carbs_per_100g = _number(row["carbs_per_100"], "carbs_per_100")
        food.fat_per_100g = _number(row["fats_per_100"], "fats_per_100")
        db.flush()

        serving_name = row.get("common_measured_unit1", "").strip()
        serving_weight = row.get("weight1", "").strip()
        if serving_name and serving_weight:
            quantity_g = _number(serving_weight, "weight1")
            serving_exists = (
                db.query(FoodServing)
                .filter(
                    FoodServing.food_id == food.id,
                    FoodServing.name == serving_name,
                    FoodServing.quantity_g == quantity_g,
                )
                .first()
            )
            if serving_exists is None:
                db.add(FoodServing(food_id=food.id, name=serving_name, quantity_g=quantity_g))
                imported_servings += 1

    db.commit()
    return imported_foods, imported_servings