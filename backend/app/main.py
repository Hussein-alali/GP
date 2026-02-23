# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import text
# from app.routers import auth, prediction, real_estate, recommendations, chatbot, brand,user
# from app.database import engine
# from app import models


# app = FastAPI(title="Real Estate System")

# # Configure CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",
#         "http://localhost:3001",
#         "http://127.0.0.1:3000",
#         "http://127.0.0.1:3001",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# models.Base.metadata.create_all(bind=engine)
# with engine.begin() as conn:
#     conn.execute(text("ALTER TABLE real_estates ADD COLUMN IF NOT EXISTS description TEXT"))
#     conn.execute(text("ALTER TABLE real_estates ADD COLUMN IF NOT EXISTS images JSONB"))
#     conn.execute(text("ALTER TABLE real_estates ALTER COLUMN images SET DEFAULT '[]'::jsonb"))
#     conn.execute(text("UPDATE real_estates SET images = '[]'::jsonb WHERE images IS NULL"))

# @app.get("/")
# def root():
#     return {"message": "Real Estate API", "docs": "/docs"}

# app.include_router(user.router, prefix="/api/user", tags=["User"])
# app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
# app.include_router(real_estate.router, prefix="/api/real_estate", tags=["Real_Estates"])
# app.include_router(prediction.router, prefix="/api/predict", tags=["Prediction"])
# app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
# # app.include_router(chatbot.router, prefix="/api")
# # app.include_router(brand.router, prefix="/api/brand")


# from fastapi import FastAPI, UploadFile, File, Depends, Form

# from fastapi.staticfiles import StaticFiles

# import shutil

# import os

# import uuid


# # Mount the static directory so images are accessible via URL

# if not os.path.exists("static/images"):

#     os.makedirs("static/images")



# app.mount("/static", StaticFiles(directory="static"), name="static")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
import os

from app.routers import auth, prediction, real_estate, recommendations, user
from app.database import engine
from app import models

app = FastAPI(title="Real Estate System")

# 1. Database & Migrations
models.Base.metadata.create_all(bind=engine)
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE real_estates ADD COLUMN IF NOT EXISTS description TEXT"))
    conn.execute(text("ALTER TABLE real_estates ADD COLUMN IF NOT EXISTS images JSONB"))

# 2. Folder Setup
if not os.path.exists("static/images"):
    os.makedirs("static/images")

# 3. Mount Static Files (MUST be before routers if you want to use them in routers)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 4. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Simplified for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Routers
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(real_estate.router, prefix="/api/real_estate", tags=["Real_Estates"])
app.include_router(prediction.router, prefix="/api/predict", tags=["Prediction"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])

@app.get("/")
def root():
    return {"message": "Real Estate API", "docs": "/docs"}