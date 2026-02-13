"""
Scripts for SwasthyaMitra project.

Run Nepal hospitals scraper:
  python scripts/scrape_nepal_hospitals.py
  or: python scripts/scripts.py
"""
import sys
from pathlib import Path

# Ensure scripts dir is on path for imports
_scripts_dir = Path(__file__).resolve().parent
if str(_scripts_dir) not in sys.path:
    sys.path.insert(0, str(_scripts_dir))

if __name__ == "__main__":
    from scrape_nepal_hospitals import main
    main()
