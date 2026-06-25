import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal, engine
from app import models

db = SessionLocal()

# owner ids from seed
O = {1: 1, 2: 2, 3: 3, 4: 4}  # ahmed=1, sara=2, mohamed=3, nour=4

props = [
    # New Cairo apartments
    (120,3,2,"New Cairo","apartments",4800000,"Modern apartment in New Cairo, 5th Settlement. Fully finished with AC.",["ac","elevator","security","parking"],"available",1),
    (150,3,2,"New Cairo","apartments",6200000,"Spacious apartment near AUC. Premium finishing, garden view.",["ac","elevator","security","garden","parking"],"available",1),
    (200,4,3,"New Cairo - 5th Settlement","apartments",9500000,"Luxury apartment with panoramic view. Smart home.",["ac","elevator","security","parking","pool"],"sold",1),
    (110,3,2,"New Cairo","apartments",4200000,"Well-located apartment, close to schools and malls.",["elevator","ac","security"],"available",2),
    (135,3,2,"New Cairo - 5th Settlement","apartments",5600000,"Semi-furnished apartment with open kitchen.",["elevator","ac","parking"],"available",2),
    (90,2,1,"New Cairo","apartments",3200000,"2-bedroom apartment, semi-finished, good price.",["elevator","security"],"rented",2),
    # New Cairo villas
    (350,5,4,"New Cairo - Katameya","villas",18000000,"Standalone villa in Katameya Heights. Private garden and pool.",["pool","garden","security","parking"],"available",4),
    (280,4,3,"New Cairo - Rehab City","villas",14500000,"Twin villa in Al-Rehab. Finished and furnished.",["garden","security","parking"],"available",4),
    (400,5,4,"New Cairo - Madinaty","villas",22000000,"Mega villa in Madinaty Phase 1. Ultra luxury.",["pool","garden","security","parking","elevator"],"available",4),
    # New Cairo studios
    (60,1,1,"New Cairo","studios",1800000,"Studio in compound near ring road.",["security","parking"],"available",2),
    (55,1,1,"New Cairo - 5th Settlement","studios",2100000,"Modern studio with lux finishing.",["elevator","ac","security"],"available",2),
    # Nasr City apartments
    (100,3,2,"Nasr City","apartments",2800000,"Classic apartment in Nasr City, Abbas El-Akkad area. Super lux.",["elevator","ac","security"],"available",2),
    (130,3,2,"Nasr City - Makram Ebeid","apartments",3400000,"Ground floor apartment with private garden.",["garden","ac","security"],"available",2),
    (80,2,1,"Nasr City","apartments",2100000,"Budget-friendly apartment near City Stars Mall.",["elevator","ac"],"available",2),
    (160,4,2,"Nasr City - 8th District","apartments",4200000,"Large family apartment, lux finishing.",["elevator","ac","security","parking"],"available",2),
    (115,3,2,"Nasr City","apartments",3100000,"Renovated apartment in quiet street.",["elevator","ac"],"available",3),
    (95,2,2,"Nasr City","apartments",2600000,"Bright apartment on high floor.",["elevator","ac","security"],"available",3),
    # Nasr City studios
    (45,1,1,"Nasr City","studios",1100000,"Studio apartment, close to metro.",["elevator"],"rented",1),
    (50,1,1,"Nasr City","studios",1300000,"Studio with balcony, fully finished.",["elevator","ac"],"available",1),
    # Nasr City offices
    (200,0,3,"Nasr City","offices",5500000,"Commercial office space, 4th floor, prime location.",["elevator","ac","security"],"available",1),
    (150,0,2,"Nasr City","offices",4800000,"Large office space in Nasr City commercial building.",["ac","elevator","security"],"available",3),
    # Heliopolis
    (115,3,2,"Heliopolis","apartments",3600000,"Vintage building apartment in Heliopolis. High ceilings.",["elevator","parking"],"available",3),
    (140,3,2,"Heliopolis - Cleopatra","apartments",4100000,"Renovated apartment near Metro.",["elevator","ac","security"],"available",3),
    (90,2,1,"Heliopolis","apartments",2600000,"2-bed apartment near Cairo Airport.",["elevator","ac"],"available",3),
    (120,3,2,"Masr El Gedida","apartments",3800000,"Modern apartment, Masr El Gedida.",["elevator","ac","parking"],"available",3),
    # 6th October
    (110,3,2,"6th October City","apartments",2200000,"Apartment in Hay Al-Wahed. Close to Hyper One.",["elevator","parking"],"available",3),
    (180,4,3,"6th October - Hay 11","apartments",3500000,"Large apartment, quiet area, garden view.",["garden","elevator","parking","ac"],"available",3),
    (75,2,1,"6th October City","apartments",1750000,"Affordable 2-bedroom apartment, close to university.",["elevator"],"available",1),
    (100,3,2,"6th October City","apartments",2500000,"Finished apartment in good compound.",["elevator","ac","security"],"available",1),
    (300,5,4,"6th October - Dreamland","villas",9500000,"Villa in Dreamland compound. Private pool and garden.",["pool","garden","security","parking"],"available",4),
    # Zamalek / Dokki / Mohandessin
    (130,3,2,"Zamalek","apartments",7500000,"Premium apartment on Nile Corniche. Nile view. Fully furnished.",["elevator","ac","security","parking"],"available",1),
    (100,2,2,"Zamalek","furnished-apartments",5800000,"Fully furnished apartment in Zamalek. Diplomatic area.",["elevator","ac","security"],"rented",1),
    (120,3,2,"Mohandessin","apartments",4200000,"Modern apartment near Shooting Club.",["elevator","ac","parking"],"available",2),
    (95,2,1,"Dokki","apartments",3100000,"2-bedroom near Cairo University.",["elevator","ac"],"available",2),
    (60,0,1,"Mohandessin","offices",2800000,"Small office in Mohandessin. Ideal for startups.",["ac","elevator"],"available",2),
    # Maadi
    (160,3,2,"Maadi","apartments",6800000,"Apartment in Maadi Degla. Quiet compound-style.",["garden","elevator","ac","security","parking"],"available",4),
    (220,4,3,"Maadi - Sarayat","villas",16000000,"Standalone villa in Maadi Sarayat. Metro nearby.",["garden","security","parking","pool"],"available",4),
    (100,2,2,"Maadi","furnished-apartments",4500000,"Furnished apartment in Maadi, perfect for expats.",["elevator","ac","security"],"rented",4),
    (85,2,1,"Maadi","apartments",3400000,"Cozy apartment, semi-furnished.",["elevator","ac"],"available",4),
    # North Coast
    (90,2,1,"North Coast - Sahel","chalets",3200000,"Chalet in Sahel compound with sea view.",["pool","security","parking"],"available",4),
    (120,3,2,"North Coast - Marina","chalets",5500000,"Chalet in Marina. Beachfront access, furnished.",["pool","garden","security","parking"],"available",4),
    (65,1,1,"North Coast","chalets",1900000,"Studio chalet near Sidi Abd El Rahman beach.",["pool","security"],"available",1),
    (150,3,2,"North Coast - Hacienda","chalets",6800000,"Luxury chalet in Hacienda Bay. Sea view.",["pool","garden","security","parking"],"available",4),
    # New Capital
    (140,3,2,"New Capital - R7","apartments",5200000,"Apartment in R7 district. Delivery 2026.",["elevator","security","parking","ac"],"available",1),
    (180,4,3,"New Capital","apartments",7800000,"Luxury apartment in New Capital. Smart building.",["elevator","security","parking","ac","pool"],"available",1),
    (400,5,5,"New Capital - Embassies District","villas",35000000,"Mega villa in Embassies District. Ultra-premium.",["pool","garden","security","elevator","parking"],"available",4),
    (110,3,2,"New Capital","apartments",4800000,"Mid-range apartment in R3 district.",["elevator","security","ac"],"available",3),
    # Offices
    (80,0,1,"New Cairo - 90th St","offices",3200000,"Office on 90th Street, New Cairo. Ground floor.",["ac","elevator","security","parking"],"available",3),
    # Furnished apartments
    (90,2,1,"New Cairo","furnished-apartments",3800000,"Fully furnished apartment, ideal for rental investment.",["elevator","ac","security"],"available",1),
    (75,1,1,"Heliopolis","furnished-apartments",2900000,"Furnished studio-style flat near airport.",["elevator","ac"],"available",3),
    # Rooms
    (30,1,1,"Nasr City","rooms",550000,"Single room in shared flat. Students welcome.",[],"available",2),
    (35,1,1,"6th October City","rooms",480000,"Furnished room, bills included.",["ac"],"available",3),
]

added = 0
for p in props:
    area,beds,baths,loc,ptype,price,desc,feats,status,owner_id = p
    prop = models.RealEstate(area=area, bedrooms=beds, bathrooms=baths, location=loc,
                              type=ptype, price=price, description=desc,
                              images=[], features=feats, status=status, owner_id=owner_id)
    db.add(prop)
    added += 1

db.commit()
db.close()
print(f"Done: {added} properties inserted.")
