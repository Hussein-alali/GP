"""
Seed script — inserts realistic Egyptian real estate test data.
Run from: C:\Users\bdalr\GP\backend
  python seed_data.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app import models
from app.services.auth_service import hash_password

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── 1. Seed users ─────────────────────────────────────────────────────────────
users_data = [
    {"username": "ahmed_hassan",  "email": "ahmed@smartestate.eg",  "password": "test1234", "phone": "01001234567", "bio": "Real estate investor in New Cairo"},
    {"username": "sara_ali",      "email": "sara@smartestate.eg",   "password": "test1234", "phone": "01112345678", "bio": "Property owner – Nasr City"},
    {"username": "mohamed_omar",  "email": "mohamed@smartestate.eg","password": "test1234", "phone": "01223456789", "bio": "Broker – 6th October"},
    {"username": "nour_ibrahim",  "email": "nour@smartestate.eg",   "password": "test1234", "phone": "01534567890", "bio": "Investor – North Coast"},
    {"username": "admin",         "email": "admin@smartestate.eg",  "password": "admin1234","phone": "01099999999", "bio": "Platform administrator", "role": "admin"},
]

created_users = {}
for ud in users_data:
    existing = db.query(models.User).filter(models.User.email == ud["email"]).first()
    if not existing:
        u = models.User(
            username=ud["username"],
            email=ud["email"],
            password=hash_password(ud["password"]),
            phone=ud.get("phone"),
            bio=ud.get("bio"),
            role=ud.get("role", "user"),
            favorites=[],
        )
        db.add(u)
        db.flush()
        created_users[ud["username"]] = u.id
        print(f"  ✓ User: {ud['username']}  (id={u.id})")
    else:
        created_users[ud["username"]] = existing.id
        print(f"  – User exists: {ud['username']}")

db.commit()

# ── 2. Seed properties ────────────────────────────────────────────────────────
properties_data = [
    # ── New Cairo ──────────────────────────────────────────────────────────────
    {"area":120,"bedrooms":3,"bathrooms":2,"location":"New Cairo","type":"apartments","price":4800000,"description":"Modern apartment in New Cairo, 5th Settlement. Fully finished with AC and built-in kitchen.","features":["ac","elevator","security","parking"],"status":"available","owner":"ahmed_hassan"},
    {"area":150,"bedrooms":3,"bathrooms":2,"location":"New Cairo","type":"apartments","price":6200000,"description":"Spacious apartment near AUC. Premium finishing, garden view.","features":["ac","elevator","security","garden","parking"],"status":"available","owner":"ahmed_hassan"},
    {"area":200,"bedrooms":4,"bathrooms":3,"location":"New Cairo – 5th Settlement","type":"apartments","price":9500000,"description":"Luxury apartment with panoramic view. Smart home system included.","features":["ac","elevator","security","parking","pool"],"status":"sold","owner":"ahmed_hassan"},
    {"area":350,"bedrooms":5,"bathrooms":4,"location":"New Cairo – Katameya","type":"villas","price":18000000,"description":"Standalone villa in Katameya Heights. Private garden and pool.","features":["pool","garden","security","parking","elevator"],"status":"available","owner":"nour_ibrahim"},
    {"area":280,"bedrooms":4,"bathrooms":3,"location":"New Cairo – Rehab City","type":"villas","price":14500000,"description":"Twin villa in Al-Rehab. Finished and furnished.","features":["garden","security","parking"],"status":"available","owner":"nour_ibrahim"},
    {"area":500,"bedrooms":6,"bathrooms":5,"location":"New Cairo – Madinaty","type":"villas","price":28000000,"description":"Mega villa in Madinaty Phase 1. Ultra luxury.","features":["pool","garden","security","parking","elevator"],"status":"available","owner":"nour_ibrahim"},
    {"area":60,"bedrooms":1,"bathrooms":1,"location":"New Cairo","type":"studios","price":1800000,"description":"Studio in compound near ring road. Ground floor.","features":["security","parking"],"status":"available","owner":"sara_ali"},
    {"area":90,"bedrooms":2,"bathrooms":1,"location":"New Cairo – 5th Settlement","type":"apartments","price":3200000,"description":"2-bedroom apartment, semi-finished, good price.","features":["elevator","security"],"status":"rented","owner":"sara_ali"},

    # ── Nasr City ──────────────────────────────────────────────────────────────
    {"area":100,"bedrooms":3,"bathrooms":2,"location":"Nasr City","type":"apartments","price":2800000,"description":"Classic apartment in Nasr City, Abbas El-Akkad area. Super lux finishing.","features":["elevator","ac","security"],"status":"available","owner":"sara_ali"},
    {"area":130,"bedrooms":3,"bathrooms":2,"location":"Nasr City – Makram Ebeid","type":"apartments","price":3400000,"description":"Ground floor apartment with private garden, Makram Ebeid.","features":["garden","ac","security"],"status":"available","owner":"sara_ali"},
    {"area":80,"bedrooms":2,"bathrooms":1,"location":"Nasr City","type":"apartments","price":2100000,"description":"Budget-friendly apartment near City Stars Mall.","features":["elevator","ac"],"status":"available","owner":"sara_ali"},
    {"area":160,"bedrooms":4,"bathrooms":2,"location":"Nasr City – 8th District","type":"apartments","price":4200000,"description":"Large family apartment, lux finishing, 4 bedrooms.","features":["elevator","ac","security","parking"],"status":"available","owner":"sara_ali"},
    {"area":45,"bedrooms":1,"bathrooms":1,"location":"Nasr City","type":"studios","price":1100000,"description":"Studio apartment, close to metro. Suitable for students.","features":["elevator"],"status":"rented","owner":"ahmed_hassan"},
    {"area":200,"bedrooms":4,"bathrooms":3,"location":"Nasr City","type":"offices","price":5500000,"description":"Commercial office space, 4th floor, prime location.","features":["elevator","ac","security"],"status":"available","owner":"ahmed_hassan"},

    # ── Heliopolis / Masr El Gedida ────────────────────────────────────────────
    {"area":115,"bedrooms":3,"bathrooms":2,"location":"Heliopolis","type":"apartments","price":3600000,"description":"Vintage building apartment in Heliopolis. High ceilings, classic style.","features":["elevator","parking"],"status":"available","owner":"mohamed_omar"},
    {"area":140,"bedrooms":3,"bathrooms":2,"location":"Masr El Gedida","type":"apartments","price":4100000,"description":"Renovated apartment in Masr El Gedida. Near Metro.","features":["elevator","ac","security"],"status":"available","owner":"mohamed_omar"},
    {"area":90,"bedrooms":2,"bathrooms":1,"location":"Heliopolis – Cleopatra","type":"apartments","price":2600000,"description":"2-bed apartment near Cairo Airport. Furnished option available.","features":["elevator","ac"],"status":"available","owner":"mohamed_omar"},

    # ── 6th October ────────────────────────────────────────────────────────────
    {"area":110,"bedrooms":3,"bathrooms":2,"location":"6th October City","type":"apartments","price":2200000,"description":"Apartment in Hay Al-Wahed, 6th October. Close to Hyper One.","features":["elevator","parking"],"status":"available","owner":"mohamed_omar"},
    {"area":180,"bedrooms":4,"bathrooms":3,"location":"6th October – Hay 11","type":"apartments","price":3500000,"description":"Large apartment, 6th October. Quiet area, garden view.","features":["garden","elevator","parking","ac"],"status":"available","owner":"mohamed_omar"},
    {"area":300,"bedrooms":5,"bathrooms":4,"location":"6th October – Dreamland","type":"villas","price":9500000,"description":"Villa in Dreamland compound. Private pool and garden.","features":["pool","garden","security","parking"],"status":"available","owner":"nour_ibrahim"},
    {"area":75,"bedrooms":2,"bathrooms":1,"location":"6th October City","type":"apartments","price":1750000,"description":"Affordable 2-bedroom apartment. Close to university.","features":["elevator"],"status":"available","owner":"ahmed_hassan"},

    # ── Zamalek / Dokki / Mohandessin ─────────────────────────────────────────
    {"area":130,"bedrooms":3,"bathrooms":2,"location":"Zamalek","type":"apartments","price":7500000,"description":"Premium apartment on the Nile Corniche. Nile view. Fully furnished.","features":["elevator","ac","security","parking"],"status":"available","owner":"ahmed_hassan"},
    {"area":100,"bedrooms":2,"bathrooms":2,"location":"Zamalek","type":"furnished-apartments","price":5800000,"description":"Fully furnished apartment in Zamalek. Diplomatic area.","features":["elevator","ac","security"],"status":"rented","owner":"ahmed_hassan"},
    {"area":120,"bedrooms":3,"bathrooms":2,"location":"Mohandessin","type":"apartments","price":4200000,"description":"Modern apartment in Mohandessin. Close to Shooting Club.","features":["elevator","ac","parking"],"status":"available","owner":"sara_ali"},
    {"area":95,"bedrooms":2,"bathrooms":1,"location":"Dokki","type":"apartments","price":3100000,"description":"2-bedroom apartment in Dokki, near Cairo University.","features":["elevator","ac"],"status":"available","owner":"sara_ali"},

    # ── Maadi ─────────────────────────────────────────────────────────────────
    {"area":160,"bedrooms":3,"bathrooms":2,"location":"Maadi","type":"apartments","price":6800000,"description":"Apartment in Maadi Degla. Quiet compound-style building.","features":["garden","elevator","ac","security","parking"],"status":"available","owner":"nour_ibrahim"},
    {"area":220,"bedrooms":4,"bathrooms":3,"location":"Maadi – Sarayat","type":"villas","price":16000000,"description":"Standalone villa in Maadi Sarayat. Walking distance to metro.","features":["garden","security","parking","pool"],"status":"available","owner":"nour_ibrahim"},
    {"area":100,"bedrooms":2,"bathrooms":2,"location":"Maadi","type":"furnished-apartments","price":4500000,"description":"Furnished apartment in Maadi, perfect for expats.","features":["elevator","ac","security"],"status":"rented","owner":"nour_ibrahim"},

    # ── North Coast ────────────────────────────────────────────────────────────
    {"area":90,"bedrooms":2,"bathrooms":1,"location":"North Coast – Sahel","type":"chalets","price":3200000,"description":"Chalet in Sahel compound with sea view. Summer use.","features":["pool","security","parking"],"status":"available","owner":"nour_ibrahim"},
    {"area":120,"bedrooms":3,"bathrooms":2,"location":"North Coast – Marina","type":"chalets","price":5500000,"description":"Chalet in Marina. Beachfront access, furnished.","features":["pool","garden","security","parking"],"status":"available","owner":"nour_ibrahim"},
    {"area":65,"bedrooms":1,"bathrooms":1,"location":"North Coast","type":"chalets","price":1900000,"description":"Studio chalet near Sidi Abd El Rahman beach.","features":["pool","security"],"status":"available","owner":"ahmed_hassan"},

    # ── New Administrative Capital ─────────────────────────────────────────────
    {"area":140,"bedrooms":3,"bathrooms":2,"location":"New Capital – R7","type":"apartments","price":5200000,"description":"Apartment in R7 district, New Capital. Delivery 2026.","features":["elevator","security","parking","ac"],"status":"available","owner":"ahmed_hassan"},
    {"area":180,"bedrooms":4,"bathrooms":3,"location":"New Capital","type":"apartments","price":7800000,"description":"Luxury apartment in New Capital. Smart building.","features":["elevator","security","parking","ac","pool"],"status":"available","owner":"ahmed_hassan"},
    {"area":400,"bedrooms":5,"bathrooms":5,"location":"New Capital – Embassies District","type":"villas","price":35000000,"description":"Mega villa in Embassies District. Ultra-premium.","features":["pool","garden","security","elevator","parking"],"status":"available","owner":"nour_ibrahim"},

    # ── Offices ───────────────────────────────────────────────────────────────
    {"area":80,"bedrooms":0,"bathrooms":1,"location":"New Cairo – 90th St","type":"offices","price":3200000,"description":"Office on 90th Street, New Cairo. Ground floor.","features":["ac","elevator","security","parking"],"status":"available","owner":"mohamed_omar"},
    {"area":150,"bedrooms":0,"bathrooms":2,"location":"Nasr City","type":"offices","price":4800000,"description":"Large office space in Nasr City commercial building.","features":["ac","elevator","security"],"status":"available","owner":"mohamed_omar"},
    {"area":60,"bedrooms":0,"bathrooms":1,"location":"Mohandessin","type":"offices","price":2800000,"description":"Small office in Mohandessin. Ideal for startups.","features":["ac","elevator"],"status":"available","owner":"sara_ali"},
]

added = 0
for pd in properties_data:
    owner_id = created_users.get(pd["owner"])
    if not owner_id:
        continue
    prop = models.RealEstate(
        area=pd["area"],
        bedrooms=pd["bedrooms"],
        bathrooms=pd["bathrooms"],
        location=pd["location"],
        type=pd["type"],
        price=pd["price"],
        description=pd.get("description",""),
        images=[],
        features=pd.get("features",[]),
        status=pd.get("status","available"),
        owner_id=owner_id,
    )
    db.add(prop)
    added += 1

db.commit()
db.close()

print(f"\n✅ Done! Added {added} properties and {len(users_data)} users.")
print("\nTest accounts:")
for u in users_data:
    print(f"  email: {u['email']}  |  password: {u['password']}")
