from fastapi import APIRouter
import json, os

router = APIRouter(prefix="/weights", tags=["weights"])

@router.get("/elite")
def get_elite_weights():
    weights_path = os.path.join(os.path.dirname(__file__), "../assets/elite_weights.json")
    if os.path.exists(weights_path):
        with open(weights_path) as f:
            return {"weights": json.load(f)}
    return {"weights": {}, "message": "No elite weights available yet"}