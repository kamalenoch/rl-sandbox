from sqlalchemy import Column, Integer, String, Float, JSON, DateTime
from sqlalchemy.sql import func
from database import Base

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    algorithm = Column(String, nullable=False)
    steps_to_solve = Column(Integer, nullable=False)
    success_rate = Column(Float, nullable=False)
    episodes_trained = Column(Integer, nullable=False)
    hyperparams = Column(JSON, nullable=False)
    grid_name = Column(String, default="maze")
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    