from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.routers import auth, prediction, real_estate, recommendations, chatbot, brand,user
from app.database import engine
from app import models


app = FastAPI(title="Real Estate System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE real_estates ADD COLUMN IF NOT EXISTS description TEXT"))
    conn.execute(text("ALTER TABLE real_estates ADD COLUMN IF NOT EXISTS images JSONB"))

@app.get("/")
def root():
    return {"message": "Real Estate API", "docs": "/docs"}

app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(real_estate.router, prefix="/api/real_estate", tags=["Real_Estates"])
app.include_router(prediction.router, prefix="/api/predict", tags=["Prediction"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
# app.include_router(chatbot.router, prefix="/api")
# app.include_router(brand.router, prefix="/api/brand")
