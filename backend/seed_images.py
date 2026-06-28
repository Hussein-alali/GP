"""Assign stock images to all seeded properties that have no images."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app import models

STOCK = {
    "apartments": [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=75",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=75",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=75",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=75",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=75",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=75",
    ],
    "villas": [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=75",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=75",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=75",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=75",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=75",
    ],
    "studios": [
        "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=900&q=75",
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900&q=75",
        "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=900&q=75",
    ],
    "offices": [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=75",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=75",
        "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=900&q=75",
    ],
    "chalets": [
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=75",
        "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=900&q=75",
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=75",
    ],
    "furnished-apartments": [
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=75",
        "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=900&q=75",
        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=900&q=75",
    ],
    "rooms": [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=75",
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=75",
    ],
}

FALLBACK = [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=75",
    "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=900&q=75",
]

db = SessionLocal()
props = db.query(models.RealEstate).all()
updated = 0

counters = {}
for prop in props:
    if prop.images:
        continue  # already has images
    pool = STOCK.get(prop.type, FALLBACK)
    idx  = counters.get(prop.type, 0) % len(pool)
    counters[prop.type] = idx + 1
    prop.images = [pool[idx], pool[(idx + 1) % len(pool)]]
    updated += 1

db.commit()
db.close()
print(f"Updated {updated} properties with stock images.")
