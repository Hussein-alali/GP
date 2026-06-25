# -*- coding: utf-8 -*-
"""
Full feature test suite for Smart Estate API.
Run: python test_all.py
"""
import requests, json, sys, io

BASE = "http://127.0.0.1:8001"
PASS = []
FAIL = []

def ok(name, detail=""):
    PASS.append(name)
    print(f"  PASS  {name}" + (f"  ->  {detail}" if detail else ""))

def fail(name, detail=""):
    FAIL.append(name)
    print(f"  FAIL  {name}" + (f"  ->  {detail}" if detail else ""))

def chk(name, cond, detail=""):
    ok(name, detail) if cond else fail(name, detail)

# helpers
def post(path, body, token=None):
    h = {"Content-Type": "application/json"}
    if token: h["Authorization"] = f"Bearer {token}"
    r = requests.post(f"{BASE}{path}", json=body, headers=h)
    return r

def get(path, token=None, params=None):
    h = {}
    if token: h["Authorization"] = f"Bearer {token}"
    return requests.get(f"{BASE}{path}", headers=h, params=params)

def put(path, body, token=None):
    h = {"Content-Type": "application/json"}
    if token: h["Authorization"] = f"Bearer {token}"
    return requests.put(f"{BASE}{path}", json=body, headers=h)

def delete(path, token=None):
    h = {}
    if token: h["Authorization"] = f"Bearer {token}"
    return requests.delete(f"{BASE}{path}", headers=h)

print("\n" + "="*60)
print("  SMART ESTATE -- FULL FEATURE TEST")
print("="*60)

# [1] ROOT / HEALTH CHECK
print("\n[1] ROOT / HEALTH CHECK")
r = requests.get(f"{BASE}/")
chk("API root responds", r.status_code == 200, r.json().get("message",""))

# [2] AUTHENTICATION
print("\n[2] AUTHENTICATION")

r = post("/api/auth/register", {"username":"testuser_ci","email":"ci_test@smartestate.eg","password":"pass1234"})
chk("Register new user", r.status_code in (200,201,400), f"status={r.status_code}")

# Login seeded user -- response has flat structure (id, username, email, access_token)
r = post("/api/auth/login", {"email":"ahmed@smartestate.eg","password":"test1234"})
chk("Login - seeded user", r.status_code == 200, "")
if r.status_code == 200:
    ahmed_data  = r.json()
    ahmed_token = ahmed_data.get("access_token", "")
    ahmed_id    = ahmed_data.get("id", 1)
else:
    ahmed_token = ""
    ahmed_id    = 1
chk("Login returns token", bool(ahmed_token), ahmed_token[:20]+"..." if ahmed_token else "")

# Login admin
r = post("/api/auth/login", {"email":"admin@smartestate.eg","password":"admin1234"})
chk("Login - admin user", r.status_code == 200, "")
if r.status_code == 200:
    admin_data  = r.json()
    admin_token = admin_data.get("access_token", "")
    admin_id    = admin_data.get("id", 5)
else:
    admin_token = ""
    admin_id    = 5

# Login wrong password
r = post("/api/auth/login", {"email":"ahmed@smartestate.eg","password":"wrong"})
chk("Login - wrong password rejected", r.status_code in (401,400,422), f"status={r.status_code}")

# Login sara
r = post("/api/auth/login", {"email":"sara@smartestate.eg","password":"test1234"})
if r.status_code == 200:
    sara_data  = r.json()
    sara_token = sara_data.get("access_token", "")
    sara_id    = sara_data.get("id", 2)
else:
    sara_token = ""
    sara_id    = 2

# [3] USER PROFILE
print("\n[3] USER PROFILE")
r = get(f"/api/user/user/{ahmed_id}/profile", ahmed_token)
chk("Get own profile", r.status_code == 200, r.json().get("username","") if r.ok else r.text[:60])

r = put(f"/api/user/user/{ahmed_id}/profile", {"bio":"Updated bio via test"}, ahmed_token)
chk("Update profile", r.status_code == 200, "bio updated")

# [4] PROPERTIES -- READ
print("\n[4] PROPERTIES - READ")
r = get("/api/real_estate/")
chk("Get all properties", r.status_code == 200, f"count={len(r.json()) if r.ok else '?'}")
all_props = r.json() if r.ok else []
chk("At least 50 properties seeded", len(all_props) >= 50, f"{len(all_props)}")

first_id = all_props[0]["id"] if all_props else 1
r = get(f"/api/real_estate/{first_id}")
chk("Get single property", r.status_code == 200, f"id={first_id} type={r.json().get('type','')}" if r.ok else r.text[:60])

r = get("/api/real_estate/", params={"min_price":1000000,"max_price":3000000})
cheap = r.json() if r.ok else []
chk("Filter by price range", r.status_code == 200 and all(1000000 <= p["price"] <= 3000000 for p in cheap), f"{len(cheap)} in range")

# [5] PROPERTIES -- CREATE / UPDATE / DELETE
print("\n[5] PROPERTIES - CREATE / UPDATE / DELETE")

# Minimal 1x1 white JPEG (smallest valid JPEG)
tiny_jpg = bytes([
    0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,
    0x00,0x01,0x00,0x00,0xFF,0xDB,0x00,0x43,0x00,0x08,0x06,0x06,0x07,0x06,0x05,0x08,
    0x07,0x07,0x07,0x09,0x09,0x08,0x0A,0x0C,0x14,0x0D,0x0C,0x0B,0x0B,0x0C,0x19,0x12,
    0x13,0x0F,0x14,0x1D,0x1A,0x1F,0x1E,0x1D,0x1A,0x1C,0x1C,0x20,0x24,0x2E,0x27,0x20,
    0x22,0x2C,0x23,0x1C,0x1C,0x28,0x37,0x29,0x2C,0x30,0x31,0x34,0x34,0x34,0x1F,0x27,
    0x39,0x3D,0x38,0x32,0x3C,0x2E,0x33,0x34,0x32,0xFF,0xC0,0x00,0x0B,0x08,0x00,0x01,
    0x00,0x01,0x01,0x01,0x11,0x00,0xFF,0xC4,0x00,0x1F,0x00,0x00,0x01,0x05,0x01,0x01,
    0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x02,0x03,0x04,
    0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0xFF,0xC4,0x00,0xB5,0x10,0x00,0x02,0x01,0x03,
    0x03,0x02,0x04,0x03,0x05,0x05,0x04,0x04,0x00,0x00,0x01,0x7D,0x01,0x02,0x03,0x00,
    0x04,0x11,0x05,0x12,0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,0x22,0x71,0x14,0x32,
    0x81,0x91,0xA1,0x08,0x23,0x42,0xB1,0xC1,0x15,0x52,0xD1,0xF0,0x24,0x33,0x62,0x72,
    0x82,0x09,0x0A,0x16,0x17,0x18,0x19,0x1A,0x25,0x26,0x27,0x28,0x29,0x2A,0x34,0x35,
    0x36,0x37,0x38,0x39,0x3A,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4A,0x53,0x54,0x55,
    0x56,0x57,0x58,0x59,0x5A,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6A,0x73,0x74,0x75,
    0x76,0x77,0x78,0x79,0x7A,0x83,0x84,0x85,0x86,0x87,0x88,0x89,0x8A,0x92,0x93,0x94,
    0x95,0x96,0x97,0x98,0x99,0x9A,0xA2,0xA3,0xA4,0xA5,0xA6,0xA7,0xA8,0xA9,0xAA,0xB2,
    0xB3,0xB4,0xB5,0xB6,0xB7,0xB8,0xB9,0xBA,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xC8,0xC9,
    0xCA,0xD2,0xD3,0xD4,0xD5,0xD6,0xD7,0xD8,0xD9,0xDA,0xE1,0xE2,0xE3,0xE4,0xE5,0xE6,
    0xE7,0xE8,0xE9,0xEA,0xF1,0xF2,0xF3,0xF4,0xF5,0xF6,0xF7,0xF8,0xF9,0xFA,0xFF,0xDA,
    0x00,0x08,0x01,0x01,0x00,0x00,0x3F,0x00,0xFB,0xD4,0xFF,0xD9,
])

form_data = {
    "area":        (None, "95"),
    "bedrooms":    (None, "2"),
    "bathrooms":   (None, "1"),
    "location":    (None, "Nasr City"),
    "type":        (None, "apartments"),
    "price":       (None, "2500000"),
    "description": (None, "CI test property"),
    "features":    (None, '["elevator","ac"]'),
    "status":      (None, "available"),
    "owner_id":    (None, str(ahmed_id)),
    "files":       ("test.jpg", io.BytesIO(tiny_jpg), "image/jpeg"),
}
r = requests.post(f"{BASE}/api/real_estate/",
                  files=form_data,
                  headers={"Authorization": f"Bearer {ahmed_token}"})
chk("Create property (form)", r.status_code in (200,201), f"status={r.status_code} {r.text[:80]}")
new_prop_id = r.json().get("id") if r.ok else None

if new_prop_id:
    r = put(f"/api/real_estate/{new_prop_id}", {"price":2600000,"status":"available"}, ahmed_token)
    chk("Update property price", r.status_code == 200, f"new price={r.json().get('price','')}" if r.ok else r.text[:60])

    r = delete(f"/api/real_estate/{new_prop_id}", ahmed_token)
    chk("Delete property", r.status_code == 200, "deleted")
else:
    fail("Update property", "skipped - no id returned")
    fail("Delete property", "skipped")

# [6] FAVORITES
print("\n[6] FAVORITES")
fav_prop_id = all_props[2]["id"] if len(all_props) > 2 else 1

r = requests.post(f"{BASE}/api/user/user/{ahmed_id}/favorites/{fav_prop_id}",
                  headers={"Authorization": f"Bearer {ahmed_token}"})
chk("Add to favorites", r.status_code in (200,201), f"prop_id={fav_prop_id}")

r = get(f"/api/user/user/{ahmed_id}/favorites", ahmed_token)
fav_list = r.json() if r.ok else []
chk("Get favorites list", r.status_code == 200, f"count={len(fav_list)}")
# favorites returns list of property objects; check by id
fav_ids = [p["id"] for p in fav_list] if fav_list and isinstance(fav_list[0], dict) else fav_list
chk("Favorite exists in list", fav_prop_id in fav_ids, f"looking for {fav_prop_id} in {fav_ids}")

r = delete(f"/api/user/user/{ahmed_id}/favorites/{fav_prop_id}", ahmed_token)
chk("Remove from favorites", r.status_code == 200, "removed")

r = get(f"/api/user/user/{ahmed_id}/favorites", ahmed_token)
fav_list2 = r.json() if r.ok else [fav_prop_id]
fav_ids2 = [p["id"] for p in fav_list2] if fav_list2 and isinstance(fav_list2[0], dict) else fav_list2
chk("Favorites empty after remove", fav_prop_id not in fav_ids2, "")

# [7] MESSAGING SYSTEM
print("\n[7] MESSAGING SYSTEM")
r = post(f"/api/messages/send?sender_id={ahmed_id}",
         {"receiver_id": sara_id, "content": "Hi Sara, is the apartment still available?"},
         ahmed_token)
chk("Send message ahmed->sara", r.status_code in (200,201), f"id={r.json().get('id','?')}" if r.ok else r.text[:80])
msg_id = r.json().get("id") if r.ok else None

r = post(f"/api/messages/send?sender_id={sara_id}",
         {"receiver_id": ahmed_id, "content": "Yes, still available! Contact me."},
         sara_token)
chk("Send reply sara->ahmed", r.status_code in (200,201), "")

r = get(f"/api/messages/inbox/{ahmed_id}", ahmed_token)
chk("Get inbox", r.status_code == 200, f"messages={len(r.json()) if r.ok else '?'}")
chk("Inbox has message", len(r.json() if r.ok else []) >= 1, "")

r = get(f"/api/messages/sent/{ahmed_id}", ahmed_token)
chk("Get sent messages", r.status_code == 200, f"sent={len(r.json()) if r.ok else '?'}")

r = get(f"/api/messages/conversation/{ahmed_id}/{sara_id}", ahmed_token)
chk("Get conversation", r.status_code == 200, f"messages={len(r.json()) if r.ok else '?'}")
chk("Conversation has 2 messages", len(r.json() if r.ok else []) >= 2, "")

r = get(f"/api/messages/unread-count/{sara_id}", sara_token)
chk("Unread count endpoint", r.status_code == 200, f"unread={r.json().get('unread','?')}" if r.ok else "")

# [8] RECOMMENDATIONS
print("\n[8] RECOMMENDATIONS")
r = get(f"/api/recommendations/user/{ahmed_id}", ahmed_token)
chk("Get recommendations", r.status_code == 200, "")
recs = r.json().get("recommended_properties",[]) if r.ok else []
chk("Recommendations returned", len(recs) > 0, f"count={len(recs)}")

# [9] PRICE PREDICTION -- VALUATION AGENT
print("\n[9] PRICE PREDICTION - VALUATION AGENT")

tests = [
    ("New Cairo apartment 3BR 120m2",   {"property_type":"apartments","city":"New Cairo","region":"","area":120,"bedrooms":3,"bathrooms":2}),
    ("Nasr City apartment 2BR 90m2",    {"property_type":"apartments","city":"Nasr City","region":"","area":90,"bedrooms":2,"bathrooms":1}),
    ("Maadi apartment 3BR 160m2",       {"property_type":"apartments","city":"Maadi","region":"","area":160,"bedrooms":3,"bathrooms":2}),
    ("New Cairo villa 5BR 350m2",       {"property_type":"villas","city":"New Cairo","region":"Katameya","area":350,"bedrooms":5,"bathrooms":4}),
    ("North Coast chalet 2BR 90m2",     {"property_type":"chalets","city":"North Coast","region":"Sahel","area":90,"bedrooms":2,"bathrooms":1}),
    ("6th Oct apartment 3BR 110m2",     {"property_type":"apartments","city":"6th October","region":"","area":110,"bedrooms":3,"bathrooms":2}),
    ("Nasr City studio 45m2",           {"property_type":"studios","city":"Nasr City","region":"","area":45,"bedrooms":1,"bathrooms":1}),
    ("New Capital apartment 3BR 140m2", {"property_type":"apartments","city":"New Capital","region":"R7","area":140,"bedrooms":3,"bathrooms":2}),
]

for label, body in tests:
    r = post("/api/valuation/estimate", body)
    if r.status_code == 200:
        d = r.json()
        exp    = d["expected_price"]
        conf   = d["confidence_score"]
        comps  = d["comparables_used"]
        out    = d["outliers_removed"]
        ok(f"Valuation: {label}", f"expected={exp:,.0f} EGP  conf={conf}  comps={comps}  outliers={out}")
    else:
        fail(f"Valuation: {label}", f"status={r.status_code} {r.text[:60]}")

# [10] ADMIN DASHBOARD
print("\n[10] ADMIN DASHBOARD")
r = get(f"/api/admin/stats?admin_id={admin_id}", admin_token)
chk("Admin stats", r.status_code == 200, str(r.json()) if r.ok else r.text[:80])
stats = r.json() if r.ok else {}
chk("Stats has users count", "total_users" in stats, f"users={stats.get('total_users','?')}")
chk("Stats has properties count", "total_properties" in stats, f"props={stats.get('total_properties','?')}")

r = get(f"/api/admin/users?admin_id={admin_id}", admin_token)
chk("Admin list users", r.status_code == 200, f"count={len(r.json()) if r.ok else '?'}")

r = get(f"/api/admin/properties?admin_id={admin_id}", admin_token)
chk("Admin list properties", r.status_code == 200, f"count={len(r.json()) if r.ok else '?'}")

admin_props = r.json() if r.ok else []
if admin_props:
    pid = admin_props[0]["id"]
    r = requests.put(f"{BASE}/api/admin/properties/{pid}/status?status=sold&admin_id={admin_id}",
                     headers={"Authorization": f"Bearer {admin_token}"})
    chk("Admin update property status->sold", r.status_code == 200, r.json().get("message","") if r.ok else r.text[:60])
    r = requests.put(f"{BASE}/api/admin/properties/{pid}/status?status=available&admin_id={admin_id}",
                     headers={"Authorization": f"Bearer {admin_token}"})
    chk("Admin restore property status->available", r.status_code == 200, "")

r = get(f"/api/admin/stats?admin_id={ahmed_id}", ahmed_token)
chk("Non-admin blocked from stats", r.status_code == 403, f"status={r.status_code}")

# [11] CHATBOT
print("\n[11] CHATBOT")
r = post("/api/chatbot/chat", {"message":"Show me apartments","user_id": ahmed_id})
chk("Chatbot responds", r.status_code == 200, f"props={len(r.json().get('properties',[]))}" if r.ok else r.text[:60])

r = post("/api/chatbot/chat", {"message":"I want a villa"})
chk("Chatbot - villa intent", r.status_code == 200 and len(r.json().get("properties",[])) > 0, "")

# [12] BRAND PROTECTION
print("\n[12] BRAND PROTECTION")
r = get("/api/brand/companies")
chk("Brand - list companies", r.status_code == 200, f"count={len(r.json().get('companies',[]))}" if r.ok else r.text[:80])

print("\n" + "="*60)
total = len(PASS) + len(FAIL)
print(f"  RESULTS:  {len(PASS)}/{total} passed   {len(FAIL)} failed")
print("="*60)
if FAIL:
    print("\n  FAILED TESTS:")
    for f in FAIL:
        print(f"    FAIL  {f}")
print()
sys.exit(0 if not FAIL else 1)
