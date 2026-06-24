from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.leaderboard import LeaderboardEntry
from routers.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

class SubmitScore(BaseModel):
    algorithm: str
    steps_to_solve: int
    success_rate: float
    episodes_trained: int
    hyperparams: dict
    grid_name: str = "maze"

@router.get("/")
def get_leaderboard(limit: int = 20, db: Session = Depends(get_db)):
    entries = (db.query(LeaderboardEntry)
               .order_by(LeaderboardEntry.steps_to_solve.asc())
               .limit(limit).all())
    return [{"rank": i+1, "username": e.username, "algorithm": e.algorithm,
             "steps_to_solve": e.steps_to_solve, "success_rate": e.success_rate,
             "episodes_trained": e.episodes_trained, "grid_name": e.grid_name,
             "submitted_at": e.submitted_at} for i, e in enumerate(entries)]

@router.post("/submit")
def submit_score(req: SubmitScore, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = LeaderboardEntry(username=current_user.username, **req.model_dump())
    db.add(entry); db.commit()
    return {"message": "Score submitted", "username": current_user.username}