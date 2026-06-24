from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import auth, leaderboard, grids, weights

Base.metadata.create_all(bind=engine)

app = FastAPI(title="RL Sandbox API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://rl-sandbox-phi.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(leaderboard.router)
app.include_router(grids.router)
app.include_router(weights.router)

@app.get("/health")
def health(): return {"status": "ok"}