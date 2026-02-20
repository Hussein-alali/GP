from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, prediction, real_estate, recommendations, chatbot, brand,user
from app.database import engine
from app import models


app = FastAPI(title="Real Estate System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(auth.router, prefix="/api/auth")
app.include_router(real_estate.router, prefix="/api/real_estate", tags=["Real_Estates"])
#app.include_router(prediction.router, prefix="/api/predict")
app.include_router(recommendations.router, prefix="/api/recommendations")
# app.include_router(chatbot.router, prefix="/api")
# app.include_router(brand.router, prefix="/api/brand")
