"""
Aqarmap.com scraper — returns live property listings as comparable objects
for the valuation agent.
"""
import re
import requests
from bs4 import BeautifulSoup
from types import SimpleNamespace

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

# Maps lowercase city/area names → verified aqarmap path (after /en/for-sale/{type}/)
# All slugs tested against aqarmap.com.eg to confirm specific (not generic) results.
_CITY_MAP = {
    # Cairo areas
    "nasr city":                  "cairo/nasr-city",
    "new cairo":                  "cairo/new-cairo",
    "maadi":                      "cairo/el-maadi",
    "el maadi":                   "cairo/el-maadi",
    "madinaty":                   "cairo/new-cairo/madinaty",
    "madinty":                    "cairo/new-cairo/madinaty",
    "heliopolis":                 "cairo/heliopolis",
    "masr el gedida":             "cairo/heliopolis",
    "ain shams":                  "cairo/ain-shams",
    "el shorouk":                 "cairo/el-shorouk",
    "shorouk":                    "cairo/el-shorouk",
    "shorouk city":               "cairo/el-shorouk",
    "dokki":                      "cairo/dokki",
    "faisal":                     "cairo/faisal",
    "helwan":                     "cairo/helwan",
    "el haram":                   "cairo/el-haram",
    "haram":                      "cairo/el-haram",
    "new administrative capital": "cairo/new-administrative-capital",
    "new capital":                "cairo/new-administrative-capital",
    "cairo":                      "cairo",
    # New Cairo sub-areas
    "rehab":                      "cairo/new-cairo/lrhb-city",
    "el rehab":                   "cairo/new-cairo/lrhb-city",
    "mostakbal city":             "cairo/new-cairo/lmstqbl-syty",
    "narges":                     "cairo/new-cairo/el-narges",
    "90th street":                "cairo/new-cairo/90th-street",
    # Giza areas
    "6th october":                "cairo/6th-of-october",
    "sixth october":              "cairo/6th-of-october",
    "october":                    "cairo/6th-of-october",
    "sheikh zayed":               "cairo/el-sheikh-zayed-city",
    "el sheikh zayed":            "cairo/el-sheikh-zayed-city",
    "zayed":                      "cairo/el-sheikh-zayed-city",
    "giza":                       "giza",
    # Coastal / other
    "alexandria":                 "alexandria",
    "alex":                       "alexandria",
    "hurghada":                   "red-sea/hurghada",
    "sharm el sheikh":            "south-sinai/sharm-el-sheikh",
    "north coast":                "north-coast",
    "sahel":                      "north-coast",
}

_TYPE_MAP = {
    "apartments":           "apartment",
    "villas":               "villa",
    "studios":              "studio",
    "offices":              "office",
    "chalets":              "chalet",
    "rooms":                "room",
    "furnished-apartments": "apartment",
}


def _parse_card(card) -> dict | None:
    text = card.get_text(" ", strip=True)

    # Total price — first number followed by "EGP" that isn't "EGP/m"
    price_m = re.search(r"([\d,]+)\s*EGP(?!\s*/)", text)
    if not price_m:
        return None
    price = int(price_m.group(1).replace(",", ""))
    if price < 100_000:      # suspiciously low → skip
        return None

    # Area in m² (first occurrence)
    area_m = re.search(r"(\d+)\s*(?:M²|m²|M2|m2|sqm)", text)
    if not area_m:
        return None
    area = float(area_m.group(1))
    if area < 20:            # unrealistic → skip
        return None

    # Beds / baths — last two standalone integers before "WhatsApp" or end
    pre_wa = text.split("WhatsApp")[0] if "WhatsApp" in text else text
    nums = re.findall(r"\b(\d+)\b", pre_wa[-80:])
    if len(nums) < 2:
        return None
    try:
        beds  = int(nums[-2])
        baths = int(nums[-1])
    except (ValueError, IndexError):
        return None

    if not (0 < beds <= 15 and 0 < baths <= 10):
        return None

    # Listing URL from the first <a> inside the card
    link = card.find("a", href=True)
    url  = ("https://aqarmap.com.eg" + link["href"]) if link else "https://aqarmap.com.eg"

    return {"price": price, "area": area, "bedrooms": beds, "bathrooms": baths, "url": url}


def _resolve_path(city: str) -> str | None:
    """Return the most specific aqarmap path for a city name, or None."""
    city_key = city.strip().lower()
    path = _CITY_MAP.get(city_key)
    if not path:
        for key, p in _CITY_MAP.items():
            if key in city_key or city_key in key:
                path = p
                break
    return path



def _fetch_cards(type_slug: str, path: str) -> list[dict]:
    """Fetch listing cards from one aqarmap page. Returns [] on any error."""
    url = f"https://aqarmap.com.eg/en/for-sale/{type_slug}/{path}/"
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=12)
        if resp.status_code != 200:
            return []
        soup = BeautifulSoup(resp.text, "html.parser")
        # Reject generic fallback pages (aqarmap redirects unknown slugs there)
        title = soup.title.text if soup.title else ""
        if "Greater Cairo" in title or "216,572" in title or "108,5" in title:
            return []
        return soup.select("article.listing-card")
    except Exception:
        return []


def _cards_to_ns(cards, property_type: str, city: str) -> list:
    results = []
    for card in cards:
        parsed = _parse_card(card)
        if parsed is None:
            continue
        results.append(SimpleNamespace(
            id          = None,
            price       = float(parsed["price"]),
            area        = parsed["area"],
            bedrooms    = parsed["bedrooms"],
            bathrooms   = parsed["bathrooms"],
            type        = property_type,
            location    = city,
            source      = "web",
            listing_url = parsed["url"],
        ))
    return results


def scrape_listings(
    property_type: str,
    city: str,
    area: float,
    bedrooms: int,
    bathrooms: int,
    max_results: int = 30,
) -> list:
    """
    Scrape aqarmap.com for comparable listings.

    Strategy:
    1. Search the exact same neighborhood/area first.
    2. If fewer than 5 results, pad with up to 5 from the parent area (one level up).
    Returns [] on any error or unknown city.
    """
    path = _resolve_path(city)
    if not path:
        return []

    type_slug = _TYPE_MAP.get(property_type, "apartment")

    cards = _fetch_cards(type_slug, path)
    return _cards_to_ns(cards, property_type, city)[:max_results]
