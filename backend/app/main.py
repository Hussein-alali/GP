from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
import os

from app.routers import auth, real_estate, recommendations, user, admin, chatbot, brand, valuation
from app.database import engine
from app import models

app = FastAPI(title="Smart Estate API")

# 1. Database & Migrations
models.Base.metadata.create_all(bind=engine)
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE real_estates ADD COLUMN IF NOT EXISTS description TEXT"))
    conn.execute(text("ALTER TABLE real_estates ADD COLUMN IF NOT EXISTS images JSONB"))
    conn.execute(text("ALTER TABLE real_estates ADD COLUMN IF NOT EXISTS features JSONB"))
    conn.execute(text("ALTER TABLE real_estates ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'available'"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS favorites JSONB"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user'"))
    conn.execute(text("UPDATE real_estates SET images = '[]'::jsonb WHERE images IS NULL"))
    conn.execute(text("UPDATE real_estates SET features = '[]'::jsonb WHERE features IS NULL"))
    conn.execute(text("UPDATE real_estates SET status = 'available' WHERE status IS NULL"))
    conn.execute(text("UPDATE users SET favorites = '[]'::jsonb WHERE favorites IS NULL"))
    conn.execute(text("UPDATE users SET role = 'user' WHERE role IS NULL"))

# 2. Folder Setup
if not os.path.exists("static/images"):
    os.makedirs("static/images")

# 3. Mount Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

# 4. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Routers
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(real_estate.router, prefix="/api/real_estate", tags=["Real_Estates"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(brand.router, prefix="/api/brand", tags=["Brand Protection"])
app.include_router(valuation.router, prefix="/api/valuation", tags=["Valuation"])


@app.get("/")
def root():
    return {"message": "Smart Estate API", "docs": "/docs"}
