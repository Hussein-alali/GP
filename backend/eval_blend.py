import pandas as pd
import re
import numpy as np
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)

from app.services import ml_predictor
from app.services.web_scraper import scrape_listings

df = pd.read_csv(r"C:\Users\bdalr\Downloads\test_set.csv")
df["price_num"] = df["price"].apply(
    lambda s: float(re.findall(r"[\d,]+", str(s))[0].replace(",", ""))
)
df = df[df["price_num"] >= 300_000].copy()

CITY_MAP = {
    "التجمع الخامس": "new cairo", "التجمع الاول": "new cairo",
    "التجمع الثالث": "new cairo", "التجمع السادس": "new cairo",
    "القاهرة الجديدة": "new cairo", "القطامية": "new cairo",
    "مدينة المستقبل": "new cairo", "العاصمة الإدارية الجديدة": "new cairo",
    "ار 8": "new cairo", "ار 7": "new cairo", "ار 4": "new cairo",
    "الحي الثاني": "new cairo", "الحي السابع": "new cairo",
    "المنطقة الثامنة": "new cairo",
    "القاهرة": "cairo", "مدينة نصر": "nasr city",
    "المعادي": "maadi", "زهراء المعادى": "maadi",
    "مصر الجديدة": "heliopolis", "شيراتون": "heliopolis",
    "هليوبوليس الجديدة": "heliopolis", "ميدان هليوبوليس": "heliopolis",
    "المقطم": "cairo", "الهرم": "cairo", "فيصل": "cairo",
    "الاباجية": "cairo", "إمبابة": "cairo", "مريوطية": "cairo",
    "النزهة الجديدة": "cairo", "حدائق القبة": "cairo",
    "الدمرداش": "cairo", "زهراء عين شمس": "cairo",
    "حدائق الاهرام": "cairo", "العبور": "cairo",
    "مدينة بدر": "cairo", "مدينة الشروق": "cairo",
    "الشيخ زايد": "sheikh zayed", "زايد الجديدة": "sheikh zayed",
    "6 اكتوبر": "6th october", "حدائق اكتوبر": "6th october",
    "مدينتي": "madinaty",
    "الإسكندرية": "alexandria", "سموحة": "alexandria",
    "محرّم بيك": "alexandria", "سيدي بشر": "alexandria",
    "عجمي": "alexandria", "ميامي": "alexandria",
    "لوران": "alexandria", "باكوس": "alexandria",
    "محطة الرمل": "alexandria", "المنتزه": "alexandria",
    "سيدي عبد الرحمن": "north coast", "راس الحكمة": "north coast",
    "العلمين": "north coast", "الساحل الشمالي": "north coast",
    "البحر الأحمر": "hurghada", "الغردقة": "hurghada",
    "سهل حشيش": "hurghada", "العين السخنة": "hurghada",
    "الجيزة": "giza", "الدقي": "giza",
}
TYPE_MAP = {
    "Apartment": "apartments", "Duplex": "apartments",
    "Penthouse": "apartments", "Roof": "apartments",
    "Studio": "studios", "Villa": "villas",
    "Standalone Villa": "villas", "Twin House": "villas",
    "Chalet": "chalets", "Townhouse": "apartments",
}

df["city_en"] = df["city"].map(CITY_MAP)
df["type_en"] = df["property_type_ext"].map(TYPE_MAP).fillna("apartments")
df = df[df["city_en"].notna()].copy().reset_index(drop=True)

# ML predictions
print(f"Running ML predictions on {len(df)} rows...")
ml_prices = []
for _, row in df.iterrows():
    res = ml_predictor.predict({
        "property_type": row["type_en"], "city": row["city_en"],
        "area_sqm": row["area_sqm"], "bedrooms": row["bedrooms"],
        "bathrooms": row["bathrooms"], "reception_rooms": 1,
        "floor_number": 0, "total_floors": 5, "finishing": "fully_finished",
        "furnished": False, "property_status": "ready", "payment_method": "cash",
        "district": row["city_en"], "amenities": [],
    })
    ml_prices.append(res["price"] if res else np.nan)

df["ml_pred"] = ml_prices
df = df[df["ml_pred"].notna()].copy()
print(f"ML done: {len(df)} rows")

# Pre-cached Dubizzle ppsqm from successful scrapes in first run
CACHED = {
    ("6th october", "apartments"): 34641.0,
    ("6th october", "studios"):    34641.0,
    ("alexandria",  "apartments"): 36774.0,
    ("alexandria",  "villas"):     78942.0,
    ("cairo",       "apartments"): 34747.0,
    ("cairo",       "studios"):    34747.0,
    ("cairo",       "villas"):     85989.0,
    ("giza",        "apartments"): 31761.0,
    ("giza",        "villas"):     41018.0,
    ("heliopolis",  "apartments"): 39063.0,
    ("heliopolis",  "studios"):    39063.0,
    ("hurghada",    "apartments"): 72600.0,
    ("hurghada",    "studios"):    72600.0,
    ("hurghada",    "villas"):     91989.0,
    ("maadi",       "apartments"): 40000.0,
    ("madinaty",    "apartments"): 59592.0,
    ("madinaty",    "studios"):    59592.0,
    ("new cairo",   "studios"):    30800.0,
    ("new cairo",   "villas"):     83509.0,
    ("north coast", "apartments"): 53863.0,
    ("north coast", "studios"):    53863.0,
    ("north coast", "villas"):     75556.0,
    ("sheikh zayed","apartments"): 37517.0,
}

# Scrape only missing combos with retries + delay
needed = set(df.groupby(["city_en", "type_en"]).groups.keys()) - set(CACHED.keys())
print(f"Scraping {len(needed)} remaining combos: {sorted(needed)}")
for (city, ptype) in sorted(needed):
    for attempt in range(3):
        try:
            time.sleep(3)
            listings = scrape_listings(ptype, city, 0, 0, 0)
            listings = [p for p in listings if p.price > 200_000 and p.area > 20]
            if listings:
                ppsqm_vals = [p.price / p.area for p in listings]
                q1, q3 = np.percentile(ppsqm_vals, 25), np.percentile(ppsqm_vals, 75)
                iqr = q3 - q1
                clean = [v for v in ppsqm_vals if q1 - 1.5 * iqr <= v <= q3 + 1.5 * iqr]
                CACHED[(city, ptype)] = float(np.median(clean or ppsqm_vals))
            else:
                CACHED[(city, ptype)] = None
            print(f"  {city}/{ptype}: {len(listings)} listings -> ppsqm={CACHED[(city, ptype)]}")
            break
        except Exception as e:
            print(f"  {city}/{ptype} attempt {attempt+1} failed: {e}")
            CACHED[(city, ptype)] = None
            time.sleep(8)

# Compute blend
blend_prices = []
for _, row in df.iterrows():
    ppsqm = CACHED.get((row["city_en"], row["type_en"]))
    if ppsqm:
        blend_prices.append(0.55 * row["ml_pred"] + 0.45 * ppsqm * row["area_sqm"])
    else:
        blend_prices.append(row["ml_pred"])
df["blend_pred"] = blend_prices

actuals = df["price_num"].values
ml_p    = df["ml_pred"].values
bl_p    = df["blend_pred"].values

def mae(a, p):   return np.mean(np.abs(a - p))
def mape(a, p):  return np.mean(np.abs((a - p) / a)) * 100
def mdape(a, p): return np.median(np.abs((a - p) / a)) * 100

print()
print("=" * 62)
print("  PROPER EVALUATION vs REAL TRANSACTION PRICES")
print("=" * 62)
print(f"  Test samples  : {len(actuals)}")
print(f"  Price range   : EGP {actuals.min():,.0f} - {actuals.max():,.0f}")
print(f"  Median price  : EGP {np.median(actuals):,.0f}")
print()
print(f"  {'Method':<24} {'MAE (EGP)':>12}  {'MAPE':>7}  {'MdAPE':>7}")
print(f"  {'-'*56}")
print(f"  {'ML only (LightGBM)':<24} {mae(actuals,ml_p):>12,.0f}  {mape(actuals,ml_p):>6.2f}%  {mdape(actuals,ml_p):>6.2f}%")
print(f"  {'ML + Dubizzle Blend':<24} {mae(actuals,bl_p):>12,.0f}  {mape(actuals,bl_p):>6.2f}%  {mdape(actuals,bl_p):>6.2f}%")
print()
print(f"  {'City':<22} {'N':>5}  {'ML MAPE':>9}  {'Blend MAPE':>11}  {'Winner':>7}")
print("  " + "-" * 60)
for city in sorted(df["city_en"].unique()):
    sub = df[df["city_en"] == city]
    a, m, b = sub["price_num"].values, sub["ml_pred"].values, sub["blend_pred"].values
    ml_m = mape(a, m)
    bl_m = mape(a, b)
    winner = "Blend" if bl_m < ml_m else "ML"
    print(f"  {city:<22} {len(a):>5}  {ml_m:>8.1f}%  {bl_m:>10.1f}%  {winner:>7}")
print("=" * 62)
