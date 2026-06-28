# 🏙️ Smart Estate

**An AI-powered web platform for the Egyptian residential real-estate market.**

Smart Estate lets users browse property listings, obtain an instant data-driven **price estimate with a confidence range**, receive **personalised recommendations**, manage their own listings, chat with a **bilingual (Arabic / English) assistant**, and benefit from an automated **brand-protection** mechanism that prevents the misuse of recognised developers' logos.

> Graduation Project — Faculty of Computer & Information Sciences, Ain Shams University.

![Python](https://img.shields.io/badge/Python-FastAPI-009688)
![Next.js](https://img.shields.io/badge/Next.js-16-000000)
![React](https://img.shields.io/badge/React-19-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1)
![ML](https://img.shields.io/badge/ML-LightGBM-orange)

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Machine-Learning Model](#-machine-learning-model)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Testing](#-testing)
- [Results](#-results)
- [Limitations & Future Work](#-limitations--future-work)
- [Authors](#-authors)

---

## ✨ Features

- **AI Price Prediction** — estimate a property's fair value with an expected price and a confidence interval, powered by a gradient-boosting model trained on real Egyptian listings.
- **Property Listings** — browse, search, and filter properties; view full details with an image gallery and an interactive map.
- **Personalised Recommendations** — content-based suggestions in three modes: *budget-aware*, *similar-property*, and *best-value*.
- **Brand Protection** — computer-vision logo verification that blocks unauthorised use of recognised developers' logos.
- **Bilingual Conversational Assistant** — a hybrid rule-based + generative-AI chatbot that answers catalogue and general questions in Arabic and English.
- **User Accounts & Roles** — registration, authentication, profiles, and listing management for owners; an admin dashboard for platform governance.

---

## 🏗️ Architecture

Smart Estate follows a classic **three-tier architecture**:

| Tier | Responsibility | Technology |
|------|----------------|------------|
| **Presentation** | User interface and interactions | Next.js / React single-page app |
| **Business** | Routing, business logic, ML inference | FastAPI service + domain services |
| **Data** | Persistence and assets | PostgreSQL (via SQLAlchemy), serialised ML model, image storage |

The browser client communicates with the API over a JSON REST contract. The API delegates to a service layer (authentication, valuation, recommendation, brand protection, scraping), and the data tier stores the relational data plus the on-disk model artifact. External services — a generative-AI provider and a classified portal — are consulted over the network.

---

## 🧰 Tech Stack

**Backend**
- FastAPI (Python) — REST API with automatic OpenAPI docs
- SQLAlchemy ORM + PostgreSQL
- LightGBM / XGBoost / CatBoost / scikit-learn — ML models
- OpenCV, imagehash, EasyOCR — brand-protection computer vision
- passlib (PBKDF2-SHA256) — password hashing

**Frontend**
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS
- Leaflet / react-leaflet — interactive maps
- lucide-react — icons
- @google/generative-ai — conversational assistant

---

## 📂 Project Structure

```
GP/
├── backend/
│   ├── main.py                  # FastAPI app: mounts routers, CORS, static images, startup migrations
│   ├── models.py                # SQLAlchemy models: User, RealEstate
│   ├── database.py              # Engine, session factory, DB configuration
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── auth_service.py          # Password hashing, token issuing & verification
│   ├── ml_predictor.py          # Loads the pipeline artifact and predicts price
│   ├── valuation_agent.py       # Confidence scoring + heuristic fallback
│   ├── recommendation_engine.py # Similarity- and value-based recommendations
│   ├── recommender.py
│   ├── brand_protection.py      # Logo detection & ownership verification
│   ├── web_scraper.py           # Live comparable listings (classified portal)
│   ├── seed_data.py             # Seeds sample users and properties
│   ├── test_all.py              # End-to-end API tests
│   ├── routers/                 # auth, real_estate, recommendations, user,
│   │                            #   admin, chatbot, brand, valuation
│   └── artifacts/
│       └── egypt_real_estate_pipeline.joblib   # Serialised ML pipeline (~77 MB)
│
├── frontend/                    # Next.js application ("gpfront")
│   ├── app/                     # Pages: home, properties, properties/[id],
│   │                            #   price-prediction, profile, profile/add-property,
│   │                            #   admin, login, register, about, contact, chatbot
│   │   └── api/chat/route.js    # Server-side route brokering the generative assistant
│   ├── components/              # Navbar, Hero, SearchBox, PropertyCard, PropertyDetails,
│   │                            #   Recommendation, ChatBot, MapPicker, Footer, AboutSection
│   ├── context/
│   │   └── LanguageContext.jsx  # Arabic / English switching
│   └── services/
│       └── api.js               # API client + access-token management
│
├── Egyptian_Real_Estate_Price_Prediction.ipynb   # Data pipeline & model training
├── OLXX.csv                     # Scraped dataset (8,942 listings, 32 columns)
└── README.md
```

---

## 🤖 Machine-Learning Model

The valuation model is a **supervised regression** trained on real Egyptian listings.

- **Target:** `log(1 + price)` (right-skewed prices → trained in log space, inverted at inference)
- **Features:** 70 engineered features (intrinsic, locational, amenity, and derived)
- **Pipeline:**
  1. Arabic text normalisation (diacritics, tatweel, letter variants, Arabic-Indic digits)
  2. Robust, segment-aware outlier removal (MAD, IQR, quantile clipping)
  3. Feature engineering (16 amenity flags, luxury score, area buckets, room ratios)
  4. **Leak-safe cross-fitted target encoding** for high-cardinality geography + one-hot for low-cardinality fields
  5. Five models compared: Ridge, Random Forest, XGBoost, **LightGBM**, CatBoost
  6. Geometric-mean tree ensemble; **LightGBM deployed** as the best single model
  7. Confidence interval (≈80%, ±1.28σ) with a transparent heuristic fallback

All preprocessing and the fitted model are serialised together into a single pipeline artifact, so production inputs are transformed exactly as in training.

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **PostgreSQL** (running locally or remotely)

### 1. Clone the repository

```bash
git clone https://github.com/Hussein-alali/GP.git
cd GP
```

### 2. Backend (FastAPI)

```bash
cd backend

# (optional) create a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# install dependencies
pip install -r requirements.txt

# set environment variables (see the section below), then run the API
uvicorn main:app --reload --port 8000
```

On start-up the API creates/updates the database schema and loads the model artifact. Interactive API docs are then available at **http://127.0.0.1:8000/docs**.

Optionally seed sample data (includes an admin account):

```bash
python seed_data.py
```

### 3. Frontend (Next.js)

```bash
cd frontend

npm install

# set the API base URL and the generative-AI key (see below), then run
npm run dev
```

The app will be available at **http://localhost:3000**.

> ℹ️ Confirm the exact environment-variable names and the API port inside `backend/database.py`, `frontend/services/api.js`, and `frontend/app/api/chat/route.js`, as these define how the two tiers connect.

---

## 🔐 Environment Variables

Create a `.env` file for each tier. Typical values:

**Backend**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/smartestate`) |

**Frontend**

| Variable | Description |
|----------|-------------|
| API base URL | Points the client at the backend (default `http://127.0.0.1:8000`) |
| Google Generative AI key | API key used by the conversational assistant route |

*(Names may differ slightly in the source — check the files referenced above.)*

---

## 🌐 API Overview

The API is organised into eight routers under the `/api` prefix:

| Router | Purpose |
|--------|---------|
| `/api/auth` | Register, login, token issuing |
| `/api/user` | Profile management |
| `/api/real_estate` | Property CRUD, search & filter |
| `/api/valuation` | AI price estimate with confidence range |
| `/api/recommendations` | Budget / similar / best-value recommendations |
| `/api/brand` | Logo detection & brand verification |
| `/api/chatbot` | Conversational assistant intents |
| `/api/admin` | User, role, and listing management; statistics |

Full, interactive documentation is auto-generated at `/docs` when the server is running.

### Data Model

- **User** — `id`, `username`, `email`, `password` (hashed), `phone`, `bio`, `role`, `favorites` (JSON)
- **RealEstate** — `id`, `area`, `bedrooms`, `bathrooms`, `location`, `type`, `price`, `description`, `images` (JSON), `features` (JSON), `status`, `owner_id`
- **Relationship:** one User owns many RealEstate records (one-to-many)

---

## 🧪 Testing

An end-to-end test script exercises the full feature set against a running server:

```bash
cd backend
python test_all.py
```

It covers registration, authentication, listing CRUD, valuation, recommendations, the assistant, brand-protection enforcement, and admin operations.

---

## 📊 Results

Evaluated on a held-out test set of **1,738** listings (from **8,689** cleaned records, 70 features):

| Model | R² | MAE (EGP) | MAPE |
|-------|----|-----------|------|
| **LightGBM** *(deployed)* | **0.812** | **1,321,763** | **19.35%** |
| XGBoost | 0.807 | 1,351,952 | 19.76% |
| CatBoost | 0.797 | 1,404,184 | — |
| Random Forest | 0.778 | 1,406,455 | — |
| Ridge | 0.722 | 1,706,210 | 25.41% |

The geometric-mean ensemble matches the best single model (R² 0.807, MAPE 19.55%). Close agreement between cross-validation (≈0.77) and test (0.81) confirms genuine generalisation. Because the data are **seller asking prices** rather than confirmed transactions, an R² around 0.81 reflects an honest, leakage-free model rather than a limitation.

---

## ⚠️ Limitations & Future Work

- Prices are **asking prices**, which bounds achievable accuracy versus transaction data.
- Data concentrate on Greater Cairo's new cities and on apartments; rarer types and regions are less reliable.
- The access token is a prototype scheme and should be replaced with a **signed JWT** before production.
- Brand-protection accuracy depends on the reference-logo library and has been verified functionally, not benchmarked.

**Planned:** transaction-price modelling, broader geographic coverage, image-based valuation, continuous retraining with drift monitoring, and stronger authentication.

---

## 👥 Authors

Developed as a Bachelor's graduation project at the Faculty of Computer & Information Sciences, Ain Shams University.

> *Add team members, supervisors, and a license here.* No formal license is currently specified; this repository is shared for academic purposes.
