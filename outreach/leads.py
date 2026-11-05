#!/usr/bin/env python3
"""
leads.py — build a cold-outreach list of local businesses from OpenStreetMap.

Why OSM: it is free, has no API key, and the data is ODbL-licensed for reuse.
You are not scraping Google Maps against their terms or paying for a data
broker. Coverage in UK towns is good for trades, dentists, salons, gyms,
estate agents and cafes — those are the niches that map well.

Usage:
    python3 leads.py --niche plumber --area Manchester
    python3 leads.py --niche dentist --area Leeds --out dentists-leeds.csv
    python3 leads.py --niche electrician --area Bristol --limit 40

Output: CSV on stdout or --out, plus a one-line summary on stderr.
Only businesses with at least one contact channel are written.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# Overpass rejects requests without a User-Agent (HTTP 406).
USER_AGENT = "uk-local-lead-builder/1.0 (one-off outreach research)"

# niche -> list of OSM tag selectors. Add your own; the syntax is
# "key=value" exactly as it appears on openstreetmap.org.
NICHES: dict[str, list[tuple[str, str]]] = {
    "plumber": [("craft", "plumber")],
    "electrician": [("craft", "electrician")],
    "roofer": [("craft", "roofer")],
    "builder": [("craft", "builder")],
    "painter": [("craft", "painter")],
    "joiner": [("craft", "joiner")],
    "gardener": [("craft", "gardener"), ("shop", "garden_centre")],
    "locksmith": [("craft", "locksmith")],
    "dentist": [("amenity", "dentist"), ("healthcare", "dentist")],
    "physio": [("healthcare", "physiotherapist")],
    "optician": [("shop", "optician")],
    "veterinary": [("amenity", "veterinary")],
    "estate_agent": [("office", "estate_agent")],
    "letting_agent": [("office", "estate_agent")],
    "accountant": [("office", "accountant")],
    "solicitor": [("office", "lawyer")],
    "hairdresser": [("shop", "hairdresser")],
    "barber": [("shop", "hairdresser")],
    "beauty": [("shop", "beauty")],
    "nail_salon": [("shop", "beauty"), ("shop", "nails")],
    "gym": [("leisure", "fitness_centre")],
    "cafe": [("amenity", "cafe")],
    "restaurant": [("amenity", "restaurant")],
    "takeaway": [("amenity", "fast_food")],
    "bakery": [("shop", "bakery")],
    "car_repair": [("shop", "car_repair")],
    "driving_school": [("office", "driving_school")],
    "cleaning": [("shop", "dry_cleaning"), ("office", "company")],
}

FIELDS = [
    "name",
    "category",
    "phone",
    "email",
    "website",
    "address",
    "postcode",
    "osm_ref",
]


# UK postcode, spaces stripped: M3 4EW -> M34EW
UK_POSTCODE = re.compile(r"^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$")
UK_COUNTRY_CODES = {"GB", "UK", "UNITED KINGDOM", "ENGLAND", "SCOTLAND", "WALES"}


def build_query(area: str, selectors: list[tuple[str, str]], timeout: int) -> str:
    """Overpass QL: find every named object with these tags inside the area.

    The ISO3166-2 constraint is not decoration. "Manchester" also names
    administrative areas in the US and Canada, and without it the query
    returns businesses in New Hampshire and Calgary.
    """
    safe_area = area.replace('"', "")
    clauses = "\n".join(
        f'  nwr["{k}"="{v}"]["name"](area.a);' for k, v in selectors
    )
    return f"""[out:json][timeout:{timeout}];
area["name"="{safe_area}"]["boundary"="administrative"]["ISO3166-2"~"^GB"]->.a;
(
{clauses}
);
out center;"""


def fetch(query: str, timeout: int, retries: int = 3) -> dict:
    """POST the query, falling back to a mirror, with polite backoff."""
    payload = urllib.parse.urlencode({"data": query}).encode()
    last_error: Exception | None = None

    for attempt in range(1, retries + 1):
        endpoint = OVERPASS_ENDPOINTS[(attempt - 1) % len(OVERPASS_ENDPOINTS)]
        request = urllib.request.Request(
            endpoint,
            data=payload,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout + 30) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            last_error = exc
            detail = exc.read()[:300].decode("utf-8", "replace")
            print(
                f"  attempt {attempt}: HTTP {exc.code} from {endpoint} — {detail}",
                file=sys.stderr,
            )
            if exc.code in (400, 429, 504):
                time.sleep(5 * attempt)
                continue
            raise
        except (urllib.error.URLError, TimeoutError) as exc:
            last_error = exc
            print(f"  attempt {attempt}: {exc}", file=sys.stderr)
            time.sleep(5 * attempt)

    raise SystemExit(f"Overpass failed after {retries} attempts: {last_error}")


def first(tags: dict[str, str], *keys: str) -> str:
    for key in keys:
        value = (tags.get(key) or "").strip()
        if value:
            return value
    return ""


def clean_website(url: str) -> str:
    url = url.strip()
    if not url:
        return ""
    if "://" not in url:
        url = "https://" + url
    return url.rstrip("/")


def format_address(tags: dict[str, str]) -> str:
    parts = [
        " ".join(
            filter(None, [tags.get("addr:housenumber", ""), tags.get("addr:street", "")])
        ),
        tags.get("addr:city", ""),
    ]
    return ", ".join(part.strip() for part in parts if part and part.strip())


def is_uk(tags: dict[str, str], postcode: str) -> bool:
    """Belt-and-braces: drop anything that identifies itself as non-UK."""
    country = (tags.get("addr:country") or "").strip().upper()
    if country and country not in UK_COUNTRY_CODES:
        return False
    compact = postcode.replace(" ", "").upper()
    if compact and not UK_POSTCODE.match(compact):
        return False
    return True


def normalise(element: dict, category: str) -> dict | None:
    tags = element.get("tags") or {}
    name = tags.get("name", "").strip()
    if not name:
        return None
    if not is_uk(tags, (tags.get("addr:postcode") or "").strip()):
        return None

    record = {
        "name": name,
        "category": category,
        "phone": first(tags, "phone", "contact:phone", "mobile", "contact:mobile"),
        "email": first(tags, "email", "contact:email"),
        "website": clean_website(first(tags, "website", "contact:website", "url")),
        "address": format_address(tags),
        "postcode": tags.get("addr:postcode", "").strip(),
        "osm_ref": f"{element.get('type', '?')}/{element.get('id', '?')}",
    }

    # A lead with no way to contact it is not a lead.
    if not (record["phone"] or record["email"] or record["website"]):
        return None
    return record


def dedupe(records: list[dict]) -> list[dict]:
    seen: set[tuple[str, str]] = set()
    unique: list[dict] = []
    for record in records:
        key = (
            record["name"].lower(),
            record["address"].lower() or record["postcode"].lower(),
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(record)
    return unique


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build a local business lead list from OpenStreetMap."
    )
    parser.add_argument("--niche", required=True, help=", ".join(sorted(NICHES)))
    parser.add_argument(
        "--area", required=True, help="UK town/city name, e.g. Manchester"
    )
    parser.add_argument("--out", help="CSV path (default: stdout)")
    parser.add_argument("--limit", type=int, default=0, help="max rows, 0 = all")
    parser.add_argument("--timeout", type=int, default=90, help="Overpass timeout")
    parser.add_argument(
        "--cache",
        action="store_true",
        help="also save the raw JSON response next to the output",
    )
    args = parser.parse_args()

    niche = args.niche.strip().lower()
    if niche not in NICHES:
        print(
            f"Unknown niche '{niche}'. Options:\n  " + ", ".join(sorted(NICHES)),
            file=sys.stderr,
        )
        return 2

    query = build_query(args.area, NICHES[niche], args.timeout)
    print(f"Querying OpenStreetMap for '{niche}' in {args.area}…", file=sys.stderr)
    data = fetch(query, args.timeout)

    records = [
        record
        for element in data.get("elements", [])
        if (record := normalise(element, niche)) is not None
    ]
    records = dedupe(records)

    with_phone = sum(1 for r in records if r["phone"])
    with_site = sum(1 for r in records if r["website"])

    if args.limit:
        records = records[: args.limit]

    if args.cache:
        cache_path = Path(args.out or "leads").with_suffix(".json")
        cache_path.write_text(json.dumps(data), encoding="utf-8")
        print(f"Raw response cached to {cache_path}", file=sys.stderr)

    if args.out:
        handle = open(args.out, "w", newline="", encoding="utf-8")
        close_handle = True
    else:
        handle = sys.stdout
        close_handle = False

    try:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(records)
    finally:
        if close_handle:
            handle.close()

    print(
        f"{len(records)} contactable leads "
        f"({with_phone} with a phone, {with_site} with a website)"
        + (f" -> {args.out}" if args.out else ""),
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
