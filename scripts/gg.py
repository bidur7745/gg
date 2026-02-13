import json
from pathlib import Path

INPUT = Path(__file__).parent / "output" / "nepal_all_health_facilities.json"
OUTPUT = Path(__file__).parent / "output" / "nepal_health_facilities_clean.json"

KEEP = ("name", "province", "district", "address", "hospital_type")

def clean_record(r):
    return {k: r.get(k) for k in KEEP}

def main():
    with open(INPUT, "r", encoding="utf-8") as f:
        data = json.load(f)
    cleaned = [clean_record(r) for r in data]
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(cleaned)} records to {OUTPUT}")

if __name__ == "__main__":
    main()