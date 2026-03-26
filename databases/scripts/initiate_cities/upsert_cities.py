#!/usr/bin/env python3
"""Read city_codes.xlsx and upsert rows into the cities table via docker exec psql."""

import re
import subprocess
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("openpyxl not installed. Install with: pip install openpyxl", file=sys.stderr)
    sys.exit(1)

SCRIPT_DIR = Path(__file__).resolve().parent
XLSX_PATH = SCRIPT_DIR / "city_codes.xlsx"

DB_CONTAINER = "retail-postgres"
DB_USER = "postgres"
DB_NAME = "retail_store"


def read_cities(path: Path) -> list[tuple[str, int, str, int]]:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active

    rows: list[tuple[str, int, str, int]] = []
    for i, row in enumerate(ws.iter_rows(min_row=1, values_only=True)):
        # skip header row
        if i == 0:
            continue
        geo_area_name, geo_area_code, city_name, city_code = row[:4]
        if city_code is None:
            continue
        clean = lambda s: re.sub(r'[\u200e\u200f\u202a-\u202e]', '', str(s)).strip()
        rows.append((clean(geo_area_name), int(geo_area_code), clean(city_name), int(city_code)))

    wb.close()
    return rows


def build_sql(rows: list[tuple[str, int, str, int]]) -> str:
    if not rows:
        return "-- no rows to upsert"

    value_lines = []
    for geo_area_name, geo_area_code, city_name, city_code in rows:
        escaped_geo = geo_area_name.replace("'", "''")
        escaped_city = city_name.replace("'", "''")
        value_lines.append(
            f"  ({geo_area_code}, '{escaped_geo}', {city_code}, '{escaped_city}')"
        )

    values = ",\n".join(value_lines)
    return f"""\
INSERT INTO cities (geographical_area_code, geographical_area_name, city_code, city_name)
VALUES
{values}
ON CONFLICT (city_code) DO UPDATE SET
  geographical_area_code = EXCLUDED.geographical_area_code,
  geographical_area_name = EXCLUDED.geographical_area_name,
  city_name = EXCLUDED.city_name;
"""


def main() -> None:
    if not XLSX_PATH.exists():
        print(f"Excel file not found: {XLSX_PATH}", file=sys.stderr)
        sys.exit(1)

    rows = read_cities(XLSX_PATH)
    print(f"Read {len(rows)} city rows from {XLSX_PATH.name}")

    sql = build_sql(rows)

    result = subprocess.run(
        ["docker", "exec", "-i", DB_CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME],
        input=sql.encode("utf-8"),
        capture_output=True,
    )

    if result.returncode != 0:
        print(f"psql error:\n{result.stderr.decode('utf-8', errors='replace')}", file=sys.stderr)
        sys.exit(1)

    print(result.stdout.decode("utf-8", errors="replace").strip())
    print(f"Upserted {len(rows)} cities into {DB_NAME} on {DB_CONTAINER}.")


if __name__ == "__main__":
    main()
