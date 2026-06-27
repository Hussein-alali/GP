"""
Dubizzle Egypt scraper — returns live property listings for the valuation agent.
URL pattern: https://www.dubizzle.com.eg/en/properties/{type-slug}/{city-slug}/
City slug is appended directly (no governorate prefix needed).
Region filtering is done client-side from the location text embedded in each card.
"""
import re
import logging
import requests
from bs4 import BeautifulSoup
from types import SimpleNamespace

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

_BASE = "https://www.dubizzle.com.eg/en/properties"

# property_type → Dubizzle URL slug
_TYPE_SLUG = {
    "apartments":           "apartments-duplex-for-sale",
    "apartment":            "apartments-duplex-for-sale",
    "furnished-apartments": "apartments-duplex-for-sale",
    "studios":              "apartments-duplex-for-sale",
    "studio":               "apartments-duplex-for-sale",
    "duplex":               "apartments-duplex-for-sale",
    "rooms":                "apartments-duplex-for-sale",
    "room":                 "apartments-duplex-for-sale",
    "villas":               "villas-for-sale",
    "villa":                "villas-for-sale",
    "chalets":              "chalets-cabins-for-sale",
    "chalet":               "chalets-cabins-for-sale",
    "offices":              "offices-for-sale",
    "office":               "offices-for-sale",
    "townhouse":            "townhouses-for-sale",
}

# city/area name (lowercase) → verified Dubizzle slug (tested, returns cards)
_CITY_SLUG = {
    # Cairo districts — direct top-level slugs
    "new cairo":                    "new-cairo",
    "nasr city":                    "nasr-city",
    "maadi":                        "maadi",
    "el maadi":                     "maadi",
    "heliopolis":                   "heliopolis",
    "masr el gedida":               "heliopolis",
    "ain shams":                    "ain-shams",
    "zamalek":                      "zamalek",
    "mohandessin":                  "mohandessin",
    "dokki":                        "dokki",
    "faisal":                       "faisal",
    "helwan":                       "helwan",
    "el haram":                     "el-haram",
    "haram":                        "el-haram",
    "madinaty":                     "madinaty",
    "madinty":                      "madinaty",
    "rehab":                        "rehab-city",
    "el rehab":                     "rehab-city",
    "rehab city":                   "rehab-city",
    "cairo":                        "cairo",
    # el-shorouk & new-administrative-capital → 404, fall back to cairo
    "el shorouk":                   "cairo",
    "shorouk":                      "cairo",
    "shorouk city":                 "cairo",
    "new administrative capital":   "cairo",
    "new capital":                  "cairo",
    # Giza areas
    "sheikh zayed":                 "sheikh-zayed",
    "el sheikh zayed":              "sheikh-zayed",
    "zayed":                        "sheikh-zayed",
    "6th october":                  "6th-of-october",
    "sixth october":                "6th-of-october",
    "october":                      "6th-of-october",
    "6 october":                    "6th-of-october",
    "giza":                         "giza",
    # Coastal / other
    "alexandria":                   "alexandria",
    "alex":                         "alexandria",
    "hurghada":                     "hurghada",
    "sharm el sheikh":              "sharm-el-sheikh",
    "north coast":                  "north-coast",
    "sahel":                        "north-coast",
    "red sea":                      "red-sea",
}

# Region/district keywords to search for in card location text (client-side filter)
# Maps user region input (lowercase) → keywords to look for in card location fragment
_REGION_KEYWORDS = {
    "madinaty":             ["madinaty", "madnaty"],
    "rehab":                ["rehab"],
    "el rehab":             ["rehab"],
    "5th settlement":       ["5th settlement", "fifth settlement"],
    "fifth settlement":     ["5th settlement", "fifth settlement"],
    "3rd settlement":       ["3rd settlement", "third settlement"],
    "third settlement":     ["3rd settlement", "third settlement"],
    "katameya":             ["katameya"],
    "el narges":            ["narges"],
    "narges":               ["narges"],
    "mostakbal":            ["mostakbal"],
    "mostakbal city":       ["mostakbal"],
    "nasr city":            ["nasr city", "nasr"],
    "heliopolis":           ["heliopolis", "heliopolis"],
    "zahraa maadi":         ["zahraa"],
    "degla":                ["degla"],
    "smoha":                ["smoha"],
    "sidi gaber":           ["sidi gaber"],
    "stanley":              ["stanley"],
    "gleem":                ["gleem"],
    "smouha":               ["smouha", "smoha"],
    "agouza":               ["agouza"],
    "el shorouk":           ["shorouk"],
    "shorouk":              ["shorouk"],
    "new capital":          ["new capital", "administrative capital", "new admin"],
    "new administrative capital": ["administrative capital", "new capital"],
}


def _resolve_city_slug(city: str) -> str | None:
    """Return Dubizzle city slug for the given city name."""
    key = city.strip().lower()
    slug = _CITY_SLUG.get(key)
    if slug:
        return slug
    # Partial match
    for k, v in _CITY_SLUG.items():
        if k in key or key in k:
            return v
    return None


def _region_keywords(region: str) -> list[str]:
    """Return list of keywords to search for in card location text."""
    key = region.strip().lower()
    kws = _REGION_KEYWORDS.get(key)
    if kws:
        return kws
    # Fall back to the region name itself if non-trivial
    return [key] if len(key) > 2 else []


def _extract_location(card) -> str:
    """Extract location fragment from card (appears just before the pin glyph + time)."""
    frags = [t.strip() for t in card.strings if t.strip()]
    for i, f in enumerate(frags):
        if "ago" in f and i >= 2:
            # Fragment at i-2 is typically the location (i-1 is the pin glyph)
            return frags[i - 2].lower()
    # Fallback: second-to-last meaningful fragment
    clean = [f for f in frags if len(f) > 3 and "ago" not in f]
    return clean[-1].lower() if clean else ""


def _parse_card(card) -> dict | None:
    text = card.get_text(" ", strip=True)

    # Price: "EGP 1,200,000" or "EGP1,200,000"
    price_m = re.search(r"EGP\s*([\d,]+)", text)
    if not price_m:
        return None
    price = int(price_m.group(1).replace(",", ""))
    if price < 100_000:
        return None

    # Area
    area_m = re.search(r"(\d+)\s*m[²2]?", text, re.I)
    if not area_m:
        return None
    area = float(area_m.group(1))
    if area < 15:
        return None

    # Beds / baths
    beds_m  = re.search(r"(\d+)\s*beds?",  text, re.I)
    baths_m = re.search(r"(\d+)\s*baths?", text, re.I)
    beds  = int(beds_m.group(1))  if beds_m  else 0
    baths = int(baths_m.group(1)) if baths_m else 0
    if beds > 20 or baths > 15:
        return None

    # Listing URL
    link = card.find("a", href=True)
    if link:
        href = link["href"]
        url  = href if href.startswith("http") else "https://www.dubizzle.com.eg" + href
    else:
        url = "https://www.dubizzle.com.eg"

    location = _extract_location(card)

    return {
        "price":    price,
        "area":     area,
        "bedrooms": beds,
        "bathrooms": baths,
        "url":      url,
        "location": location,
    }


def _fetch_cards(url: str) -> list:
    """Fetch all listing cards from a Dubizzle page."""
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=15)
        logger.info("Dubizzle GET %s → %s", url, resp.status_code)
        if resp.status_code != 200:
            return []
        soup = BeautifulSoup(resp.text, "html.parser")
        cards  = soup.select("article._628e95c4")
        cards += soup.select("article._8fbcbbaf._7206d6f6")
        return cards
    except Exception as exc:
        logger.warning("Dubizzle fetch error: %s", exc)
        return []


def scrape_listings(
    property_type: str,
    city: str,
    area: float,
    bedrooms: int,
    bathrooms: int,
    region: str = "",
    max_results: int = 40,
) -> list:
    """
    Scrape dubizzle.com.eg for comparable listings.

    - Builds URL: {base}/{type-slug}/{city-slug}/
    - If region is provided, filters cards client-side by location text.
    - No broader area fallback — strict city+region only.
    - Returns [] on unknown city or any fetch error.
    """
    type_slug = _TYPE_SLUG.get(property_type.lower(), "apartments-duplex-for-sale")
    city_slug = _resolve_city_slug(city)
    if not city_slug:
        logger.warning("Dubizzle: unknown city '%s'", city)
        return []

    # If the region itself is a known top-level Dubizzle slug, use it as the city
    region_as_city = _resolve_city_slug(region) if region else None
    if region_as_city and region_as_city != city_slug:
        # Region has its own Dubizzle city-level page — use it, no text filter needed
        url       = f"{_BASE}/{type_slug}/{region_as_city}/"
        region_kws = []
    else:
        url        = f"{_BASE}/{type_slug}/{city_slug}/"
        region_kws = _region_keywords(region) if region else []

    cards = _fetch_cards(url)
    if not cards:
        logger.info("Dubizzle: 0 cards from %s", url)
        return []

    results = []
    for card in cards:
        parsed = _parse_card(card)
        if parsed is None:
            continue
        # Apply region keyword filter
        if region_kws:
            loc = parsed["location"]
            if not any(kw in loc for kw in region_kws):
                continue
        results.append(SimpleNamespace(
            id          = None,
            price       = float(parsed["price"]),
            area        = parsed["area"],
            bedrooms    = parsed["bedrooms"],
            bathrooms   = parsed["bathrooms"],
            type        = property_type,
            location    = f"{city}{', ' + region if region else ''}",
            source      = "Dubizzle",
            listing_url = parsed["url"],
        ))

    logger.info(
        "Dubizzle: %d usable listings (region filter: %s) from %s",
        len(results), region_kws or "none", url
    )
    return results[:max_results]
