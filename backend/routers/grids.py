from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.grid import SavedGrid
from routers.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/grids", tags=["grids"])

class SaveGridRequest(BaseModel):
    name: str
    grid_data: list
    rows: int
    cols: int

@router.post("/save")
def save_grid(req: SaveGridRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    grid = SavedGrid(user_id=user.id, name=req.name, grid_data=req.grid_data, rows=req.rows, cols=req.cols)
    db.add(grid); db.commit(); db.refresh(grid)
    return {"id": grid.id, "name": grid.name}

@router.get("/my")
def my_grids(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    grids = db.query(SavedGrid).filter(SavedGrid.user_id == user.id).all()
    return [{"id": g.id, "name": g.name, "rows": g.rows, "cols": g.cols, "created_at": g.created_at} for g in grids]

@router.get("/{grid_id}")
def get_grid(grid_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    grid = db.query(SavedGrid).filter(SavedGrid.id == grid_id, SavedGrid.user_id == user.id).first()
    if not grid: raise HTTPException(404, "Grid not found")
    return {"id": grid.id, "name": grid.name, "grid_data": grid.grid_data, "rows": grid.rows, "cols": grid.cols}