"""
Scrape all hospitals in Nepal from multiple data sources.

Output fields: name, province, district, address, hospital_type (optional), image_url (optional)

Data Sources:
1. Health Information Portal (HIP) - Named hospitals with images and addresses
2. Government ArcGIS API - All health facilities (hospital, zonal, district, etc.)
3. NSSD (Nepal Social Security) - Province-wise hospital list
4. HDX OpenStreetMap - Health facilities with names and addresses (optional download)
"""

import csv
import json
import re
import time
import zipfile
import io
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


# ============ NEPAL GEOGRAPHY MAPPINGS ============
PROVINCE_NAMES = {
    1: "Koshi",
    2: "Madhesh",
    3: "Bagmati",
    4: "Gandaki",
    5: "Lumbini",
    6: "Karnali",
    7: "Sudurpashchim",
}

# District name -> Province name
DISTRICT_TO_PROVINCE = {
    "Jhapa": "Koshi", "Ilam": "Koshi", "Illam": "Koshi", "Panchthar": "Koshi",
    "Taplejung": "Koshi", "Tehrathum": "Koshi", "Sankhuwasabha": "Koshi",
    "Bhojpur": "Koshi", "Dhankuta": "Koshi", "Morang": "Koshi", "Sunsari": "Koshi",
    "Udayapur": "Koshi", "Udaypur": "Koshi", "Khotang": "Koshi",
    "Solukhumbu": "Koshi", "Okhaldhunga": "Koshi",
    "Saptari": "Madhesh", "Siraha": "Madhesh", "Dhanusha": "Madhesh",
    "Mahottari": "Madhesh", "Sarlahi": "Madhesh", "Rautahat": "Madhesh",
    "Bara": "Madhesh", "Parsa": "Madhesh",
    "Sindhuli": "Bagmati", "Ramechhap": "Bagmati", "Dolakha": "Bagmati",
    "Kavrepalanchowk": "Bagmati", "Kavre": "Bagmati", "Sindhupalchowk": "Bagmati",
    "Bhaktapur": "Bagmati", "Kathmandu": "Bagmati", "Lalitpur": "Bagmati",
    "Makwanpur": "Bagmati", "Chitwan": "Bagmati", "Dhading": "Bagmati",
    "Nuwakot": "Bagmati", "Rasuwa": "Bagmati",
    "Gorkha": "Gandaki", "Manang": "Gandaki", "Mustang": "Gandaki",
    "Lamjung": "Gandaki", "Kaski": "Gandaki", "Myagdi": "Gandaki",
    "Syangja": "Gandaki", "Tanahu": "Gandaki", "Tanahun": "Gandaki",
    "Baglung": "Gandaki", "Parbat": "Gandaki", "Nawalpur": "Gandaki",
    "Rupandehi": "Lumbini", "Palpa": "Lumbini",
    "Kapilbastu": "Lumbini", "Arghakhachi": "Lumbini", "Gulmi": "Lumbini",
    "Pyuthan": "Lumbini", "Dang": "Lumbini", "Rolpa": "Lumbini",
    "Banke": "Lumbini", "Bardia": "Lumbini", "Bardiya": "Lumbini",
    "Nawalparasi": "Lumbini", "Rukum": "Lumbini",
    "Salyan": "Karnali", "Dolpa": "Karnali", "Jajarkot": "Karnali",
    "Surkhet": "Karnali", "Dailekh": "Karnali", "Kalikot": "Karnali",
    "Jumla": "Karnali", "Mugu": "Karnali", "Humla": "Karnali",
    "Kailali": "Sudurpashchim", "Kanchanpur": "Sudurpashchim",
    "Doti": "Sudurpashchim", "Achham": "Sudurpashchim", "Bajura": "Sudurpashchim",
    "Dadeldhura": "Sudurpashchim", "Bajhang": "Sudurpashchim",
    "Baitadi": "Sudurpashchim", "Darchula": "Sudurpashchim",
    "Biratnagar": "Koshi", "Bhadrapur": "Koshi", "Dharan": "Koshi",
    "Janakpur": "Madhesh", "Janakpurdham": "Madhesh", "Birgunj": "Madhesh",
    "Hetauda": "Bagmati", "Dhulikhel": "Bagmati", "Pokhara": "Gandaki",
    "Nepalgunj": "Lumbini", "Butwal": "Lumbini", "Bhairahawa": "Lumbini",
    "Siddharthanagar": "Lumbini", "Tulsipur": "Lumbini", "Gulariya": "Lumbini",
    "Birendranagar": "Karnali", "Dhangadhi": "Sudurpashchim",
    "Mahendranagar": "Sudurpashchim", "Bhimdatta": "Sudurpashchim",
}


def get_province_from_district(district: str) -> Optional[str]:
    """Get province name from district (handles common variations)."""
    if not district:
        return None
    clean = district.strip()
    return DISTRICT_TO_PROVINCE.get(clean) or DISTRICT_TO_PROVINCE.get(
        clean.title()
    )


def get_province_from_number(num) -> Optional[str]:
    """Get province name from province number (1-7)."""
    if num is None:
        return None
    try:
        return PROVINCE_NAMES.get(int(float(num)))
    except (ValueError, TypeError):
        return None


# ============ COORDINATE-BASED DISTRICT LOOKUP ============
NEPAL_DISTRICTS_GEOJSON_URL = (
    "https://raw.githubusercontent.com/mesaugat/geoJSON-Nepal/master/nepal-districts.geojson"
)


def _point_in_polygon(lon: float, lat: float, ring: list) -> bool:
    """Ray casting: point inside polygon. ring = list of [lon, lat]."""
    n = len(ring)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def _load_district_polygons(cache_dir: Optional[Path] = None) -> list[tuple[str, list]]:
    """Load Nepal district polygons. Returns [(district_name, coords_ring), ...]"""
    cache_file = (cache_dir or Path(__file__).parent / "output") / "nepal_districts_cache.json"
    try:
        if cache_file.exists():
            with open(cache_file, encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass

    try:
        resp = requests.get(NEPAL_DISTRICTS_GEOJSON_URL, timeout=30, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[Geo] Could not load districts: {e}")
        return []

    result = []
    for feat in data.get("features", []):
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        dist_name = (props.get("DISTRICT") or props.get("district") or "").strip()
        if not dist_name:
            continue
        coords = geom.get("coordinates", [])
        if geom.get("type") == "Polygon" and coords:
            ring = coords[0]  # exterior ring
        elif geom.get("type") == "MultiPolygon" and coords:
            ring = coords[0][0]  # first polygon, exterior ring
        else:
            continue
        result.append((dist_name, ring))

    try:
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(result, f)
    except Exception:
        pass
    return result


# GeoJSON district names (uppercase) -> our canonical district name
_GEOJSON_DISTRICT_ALIASES = {
    "KAVREPALANCHOK": "Kavrepalanchowk", "KAPILVASTU": "Kapilbastu",
    "SINDHUPALCHOK": "Sindhupalchowk", "RUPANDEHI": "Rupandehi",
}


def lookup_district_from_coords(
    lon: float, lat: float, polygons: list[tuple[str, list]]
) -> tuple[Optional[str], Optional[str]]:
    """Return (district, province) for coordinates."""
    for dist_key, ring in polygons:
        if _point_in_polygon(lon, lat, ring):
            canonical = _GEOJSON_DISTRICT_ALIASES.get(dist_key.upper())
            if not canonical:
                canonical = dist_key if dist_key in DISTRICT_TO_PROVINCE else dist_key.title()
            province = DISTRICT_TO_PROVINCE.get(canonical)
            return (canonical, province or "")
    return (None, None)


# ============ SCRAPERS ============
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}


def scrape_health_info_portal() -> list[dict]:
    """
    Scrape Health Information Portal (hip.sbkmtrust.org.np) for hospitals.
    Returns: name, province, district, address, hospital_type, image_url
    """
    url = "https://www.hip.sbkmtrust.org.np/?page_id=78"
    hospitals = []
    seen = set()

    try:
        resp = requests.get(url, timeout=45, headers=HEADERS)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding or "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")

        # Province sections
        province_anchors = {
            "koshi-en": "Koshi",
            "madhesh-en": "Madhesh",
            "bagmati-en": "Bagmati",
            "gandaki-en": "Gandaki",
            "lumbini-en": "Lumbini",
            "karnali-en": "Karnali",
            "sudurpashchim-en": "Sudurpashchim",
        }

        current_province = None
        for elem in soup.find_all(["h2", "h3", "h4", "a", "img"]):
            if elem.name in ("h2", "h3") and elem.get("id"):
                pid = elem.get("id", "").lower()
                current_province = province_anchors.get(pid, current_province)

            if elem.name == "a" and elem.get("href", "").find("directory=") != -1:
                card = elem
                img = card.find("img")
                name_elem = card.find("h4") or card.find("h3") or card.find("h2")
                if not name_elem:
                    continue

                name = (name_elem.get_text(strip=True) or "").replace("\xa0", " ")
                if not name or name in seen:
                    continue
                seen.add(name)

                # Image URL
                image_url = None
                if img and img.get("src"):
                    image_url = urljoin(url, img["src"])

                # Address - usually in text after name, before next card
                addr_parts = []
                for t in card.stripped_strings:
                    if t != name and not t.startswith("http"):
                        addr_parts.append(t)
                address = " ".join(addr_parts).strip() if addr_parts else ""

                province = current_province or ""
                district = ""
                for d, p in DISTRICT_TO_PROVINCE.items():
                    if d.lower() in address.lower() and p == province:
                        district = d
                        break
                if not district and address:
                    for d in DISTRICT_TO_PROVINCE:
                        if d.lower() in address.lower():
                            district = d
                            province = province or DISTRICT_TO_PROVINCE[d]
                            break

                hospitals.append({
                    "name": name,
                    "province": province,
                    "district": district,
                    "address": address,
                    "hospital_type": None,
                    "image_url": image_url,
                    "source": "HIP",
                    "latitude": None,
                    "longitude": None,
                })
    except Exception as e:
        print(f"[HIP] Error: {e}")

    return hospitals


def fetch_arcgis_hospitals() -> list[dict]:
    """
    Fetch health facilities from Government ArcGIS API.
    Filters for Hospital, Zonal, District, Regional, Sub-Regional, etc.
    """
    base = "https://services7.arcgis.com/arZnhQhtvIXpgVPD/ArcGIS/rest/services"
    layer_url = f"{base}/Access_to_Health_Facilities_in_Nepal_WFL1/FeatureServer/2"

    # Hospital-like types
    hospital_types = [
        "Hospital", "Zonal Hospital", "District Hospital", "Regional Hospital",
        "Sub Regional Hospital", "Provincial Hospital", "Central Hospital",
        "Teaching Hospital", "DPHO",
    ]

    all_features = []
    offset = 0
    batch = 2000

    where_clause = "HF_TYPE IN ('Hospital','DPHO','Primary Health Center','Health Post') OR HF_TYPE LIKE '%Hospital%' OR HF_TYPE LIKE '%Zonal%' OR HF_TYPE LIKE '%District%'"
    # Simplify: get all facility types, filter later
    where_clause = "1=1"

    while True:
        url = (
            f"{layer_url}/query?where={where_clause}"
            f"&outFields=HF_TYPE,DIST_NAME,VDC_NAME1,ProvNum"
            f"&returnGeometry=false"
            f"&resultOffset={offset}"
            f"&resultRecordCount={batch}"
            f"&f=json"
        )
        try:
            resp = requests.get(url, timeout=60, headers=HEADERS)
            data = resp.json()
        except Exception as e:
            print(f"[ArcGIS] Error: {e}")
            break

        features = data.get("features", [])
        if not features:
            break

        for f in features:
            attrs = f.get("attributes", {})
            hf_type = attrs.get("HF_TYPE") or ""
            if not hf_type:
                continue
            dist = attrs.get("DIST_NAME") or ""
            vdc = attrs.get("VDC_NAME1") or ""
            prov_num = attrs.get("ProvNum")
            province = get_province_from_number(prov_num)
            address = f"{vdc}, {dist}, Nepal" if vdc and dist else (f"{vdc}, Nepal" if vdc else (f"{dist}, Nepal" if dist else ""))

            # Only include hospital-level facilities (skip Health Post for "hospitals" list)
            is_hospital = any(
                x in hf_type for x in
                ["Hospital", "Zonal", "District", "Regional", "Sub Regional",
                 "Provincial", "Central", "Teaching", "DPHO", "Primary Health"]
            )

            name = f"{hf_type} - {vdc}, {dist}" if vdc and dist else f"{hf_type} - {dist}"

            all_features.append({
                "name": name,
                "province": province or "",
                "district": dist,
                "address": address,
                "hospital_type": hf_type,
                "image_url": None,
                "source": "ArcGIS",
                "_is_hospital_level": is_hospital,
                "latitude": None,
                "longitude": None,
            })
        offset += len(features)
        if len(features) < batch:
            break
        time.sleep(0.3)

    # Deduplicate by (district, vdc, type) - ArcGIS may have duplicates
    seen = set()
    unique = []
    for h in all_features:
        key = (h["district"], h["address"], h["hospital_type"])
        if key not in seen:
            seen.add(key)
            unique.append(h)

    return unique


def scrape_nssd(verify_ssl: bool = True) -> list[dict]:
    """Scrape NSSD (nssd.dohs.gov.np) for province-wise hospital names.
    Set verify_ssl=False if the site has certificate issues (e.g. expired cert).
    """
    url = "https://nssd.dohs.gov.np/province.html"
    hospitals = []

    try:
        resp = requests.get(url, timeout=30, headers=HEADERS, verify=verify_ssl)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        province_map = {
            "PROVINCE 1": "Koshi",
            "MADHES": "Madhesh",
            "MADHESH": "Madhesh",
            "BAGMATI": "Bagmati",
            "GANDAKI": "Gandaki",
            "LUMBINI": "Lumbini",
            "KARNALI": "Karnali",
            "SUDURPASCHIM": "Sudurpashchim",
            "SUDURPASHCHIM": "Sudurpashchim",
        }

        current_province = None
        for elem in soup.find_all(["strong", "h2", "h3", "h4", "p", "li"]):
            text = elem.get_text(strip=True).upper()
            for key, prov in province_map.items():
                if key in text and len(text) < 50:
                    current_province = prov
                    break

            if current_province:
                name = elem.get_text(strip=True)
                if name and len(name) > 3 and name.upper() not in province_map:
                    if re.match(r"^[\d\.]+\s*", name):
                        name = re.sub(r"^[\d\.]+\s*", "", name)
                    if 5 < len(name) < 150 and "HOSPITAL" in name.upper():
                        hospitals.append({
                            "name": name.strip(),
                            "province": current_province,
                            "district": "",
                            "address": "",
                            "hospital_type": None,
                            "image_url": None,
                            "source": "NSSD",
                            "latitude": None,
                            "longitude": None,
                        })
    except Exception as e:
        print(f"[NSSD] Error: {e}")

    return hospitals


def fetch_hdx_osm(output_dir: Optional[Path] = None) -> list[dict]:
    """
    Download and parse HDX OpenStreetMap health facilities GeoJSON.
    Enriches with district/province from coordinates via Nepal district boundaries.
    """
    url = "https://data.humdata.org/dataset/a1c166f4-803e-4578-a6c5-3f3efb8e2444/resource/f80102cf-de5e-4be9-9a0d-fae3ab4387fe/download/hotosm_npl_health_facilities_points_geojson.zip"
    alt_url = "https://s3.dualstack.us-east-1.amazonaws.com/production-raw-data-api/ISO3/NPL/health_facilities/points/hotosm_npl_health_facilities_points_geojson.zip"
    hospitals = []

    for try_url in (url, alt_url):
        try:
            resp = requests.get(try_url, timeout=120, stream=True, headers=HEADERS)
            resp.raise_for_status()
            break
        except Exception:
            continue
    else:
        return hospitals

    try:
        z = zipfile.ZipFile(io.BytesIO(resp.content))
        for name in z.namelist():
            if name.endswith(".geojson") or name.endswith(".json"):
                with z.open(name) as f:
                    data = json.load(f)
                break
        else:
            return hospitals

        # Load district polygons for coordinate lookup
        out_dir = output_dir or Path(__file__).parent / "output"
        polygons = _load_district_polygons(out_dir)
        if polygons:
            print(f"[HDX] Loaded {len(polygons)} district boundaries for enrichment")

        features = data.get("features", [])
        for feat in features:
            props = feat.get("properties", {})
            geom = feat.get("geometry")
            if not geom or geom.get("type") != "Point":
                continue

            coords = geom.get("coordinates", [])
            lon, lat = (coords[0], coords[1]) if len(coords) >= 2 else (None, None)

            name_val = props.get("name") or props.get("name:en") or props.get("name_ne")
            if not name_val or len(name_val) < 3:
                continue

            healthcare = (props.get("healthcare") or props.get("amenity") or "").lower()
            if not healthcare:
                continue
            if healthcare in ("pharmacy", "pharmacist"):
                continue

            # Build address from all available OSM address fields
            addr_parts = [
                props.get("addr:full") or props.get("addr_full"),
                props.get("addr:street") or props.get("addr_street"),
                props.get("addr:city") or props.get("addr_city"),
                props.get("addr:place") or props.get("addr_place"),
                props.get("addr:village") or props.get("addr_village"),
                props.get("addr:municipality") or props.get("addr_municipality"),
            ]
            address = ", ".join(p for p in addr_parts if p) or ""

            # District/province: from coords first, then from address/name
            district = ""
            province = ""
            if lon is not None and lat is not None and polygons:
                district, province = lookup_district_from_coords(lon, lat, polygons)
                district = district or ""
                province = province or ""
            if not district or not province:
                for d, p in DISTRICT_TO_PROVINCE.items():
                    if d.lower() in (address + " " + (name_val or "")).lower():
                        district = d
                        province = p
                        break

            hospitals.append({
                "name": name_val.strip(),
                "province": province,
                "district": district,
                "address": address.strip(),
                "hospital_type": healthcare,
                "image_url": None,
                "source": "HDX_OSM",
                "latitude": round(lat, 6) if lat is not None else None,
                "longitude": round(lon, 6) if lon is not None else None,
            })

        if output_dir:
            out_path = output_dir / "hotosm_npl_health_facilities.json"
            with open(out_path, "w", encoding="utf-8") as of:
                json.dump(data, of, ensure_ascii=False, indent=2)
            print(f"[HDX] Saved raw data to {out_path}")
    except Exception as e:
        print(f"[HDX] Error (optional): {e}")

    return hospitals


# ============ MERGE & DEDUPLICATE ============
def normalize_name(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").lower().strip())


def merge_hospitals(
    hip: list,
    arcgis: list,
    nssd: list,
    hdx: list,
    include_health_posts: bool = False,
) -> list[dict]:
    """
    Merge and deduplicate hospitals. Prefer HIP > NSSD > ArcGIS > HDX for conflicts.
    """
    by_key = {}
    source_priority = {"HIP": 0, "NSSD": 1, "ArcGIS": 2, "HDX_OSM": 3}

    def add(h: dict, force: bool = False):
        key = normalize_name(h["name"])
        if not key or len(key) < 4:
            return
        if key in by_key and not force:
            existing = by_key[key]
            if source_priority.get(h["source"], 99) >= source_priority.get(existing["source"], 0):
                return
        by_key[key] = h

    for h in hip:
        add(h, force=True)
    for h in nssd:
        add(h)
    for h in hdx:
        add(h)

    for h in arcgis:
        if not include_health_posts and not h.get("_is_hospital_level"):
            continue
        # ArcGIS has generated names - try to match existing by district+type
        key = normalize_name(h["name"])
        add(h)

    result = []
    for h in by_key.values():
        out = {k: v for k, v in h.items() if k != "_is_hospital_level"}
        result.append(out)
    return result


# ============ MAIN ============
def main():
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)

    print("Fetching hospitals from Health Information Portal...")
    hip = scrape_health_info_portal()
    print(f"  Found {len(hip)} hospitals")

    print("Fetching from Government ArcGIS API...")
    arcgis = fetch_arcgis_hospitals()
    print(f"  Found {len(arcgis)} health facilities")

    print("Scraping NSSD...")
    nssd = scrape_nssd(verify_ssl=False)  # NSSD site may have expired SSL cert
    print(f"  Found {len(nssd)} hospitals")

    print("Downloading HDX OpenStreetMap data (optional)...")
    hdx = fetch_hdx_osm(output_dir)
    print(f"  Found {len(hdx)} facilities")

    merged = merge_hospitals(hip, arcgis, nssd, hdx, include_health_posts=False)

    # Also create full list with health posts
    merged_full = merge_hospitals(hip, arcgis, nssd, hdx, include_health_posts=True)

    # Save JSON
    out_json = output_dir / "nepal_hospitals.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {len(merged)} hospitals to {out_json}")

    out_json_full = output_dir / "nepal_all_health_facilities.json"
    with open(out_json_full, "w", encoding="utf-8") as f:
        json.dump(merged_full, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(merged_full)} all facilities to {out_json_full}")

    # Save CSV
    out_csv = output_dir / "nepal_hospitals.csv"
    if merged:
        headers = ["name", "province", "district", "address", "hospital_type", "image_url", "latitude", "longitude", "source"]
        with open(out_csv, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=headers, extrasaction="ignore")
            w.writeheader()
            w.writerows(merged)
        print(f"Saved CSV to {out_csv}")

    return merged


if __name__ == "__main__":
    main()
