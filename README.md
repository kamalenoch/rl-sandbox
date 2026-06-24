# RL Sandbox — Real-Time Reinforcement Learning Simulation Engine

> Train Q-Learning and SARSA agents on interactive gridworlds, visualize Q-value convergence in real-time, and compete on the global leaderboard.

**[Live Demo](https://rl-sandbox.vercel.app)** · **[API Docs](https://rl-sandbox-api.onrender.com/docs)**

---

## Architecture

The core insight behind this project is a deliberate architectural decision: **all simulation compute runs client-side**.

Traditional approaches stream training updates from a backend via WebSockets. Under concurrent load, this chokes a free-tier server with matrix operations and drops connections. This project eliminates that bottleneck entirely.

```
┌─────────────────────────────────────────────┐
│              Browser (Client)               │
│                                             │
│  ┌─────────────┐    ┌────────────────────┐  │
│  │  RL Engine  │    │   Canvas Renderer  │  │
│  │  TypeScript │───▶│   HTML5 Canvas     │  │
│  │             │    │   ~60 FPS          │  │
│  │  Q-Learning │    └────────────────────┘  │
│  │  SARSA      │                            │
│  └──────┬──────┘                            │
└─────────┼───────────────────────────────────┘
          │ Auth / Save Grid / Leaderboard
          ▼
┌─────────────────────────────────────────────┐
│         FastAPI Backend (Control Plane)     │
│         PostgreSQL · JWT Auth               │
│         Deployed on Render (free tier)      │
└─────────────────────────────────────────────┘
```

**Result:** Zero server-side compute per simulation. The backend only handles persistence — auth, saved grids, leaderboard submissions.

---

## Features

- **Live Training Visualization** — Watch Q-value heatmaps update per episode as the agent explores
- **Interactive Grid Editor** — Click/drag to place walls, traps (negative terminal), or mud (negative reward) *while training is running*; the agent dynamically adapts
- **Algorithm Comparison** — Switch between Q-Learning (off-policy) and SARSA (on-policy) and observe different convergence behaviors
- **Real-Time Hyperparameter Control** — Adjust learning rate (α), discount factor (γ), and epsilon decay mid-run
- **Deploy Elite Agent** — Fetches pre-trained weights from the backend; agent instantly solves the maze with zero exploration
- **Global Leaderboard** — Submit your best hyperparameter config: fewest steps to goal wins

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| RL Engine | Pure TypeScript (no ML libraries) |
| Rendering | HTML5 Canvas API |
| Backend | FastAPI + SQLAlchemy |
| Database | PostgreSQL |
| Auth | JWT (python-jose + bcrypt) |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Project Structure

```
rl-sandbox/
├── frontend/
│   └── src/
│       ├── engine/
│       │   ├── types.ts          # Shared types: Cell, Action, HyperParams
│       │   ├── environment.ts    # GridEnvironment — step(), reward model, presets
│       │   ├── qlearning.ts      # QLearningAgent — off-policy TD control
│       │   └── sarsa.ts          # SARSAAgent — on-policy TD control
│       ├── components/
│       │   └── GridCanvas.tsx    # Canvas renderer with Q-value heatmap overlay
│       ├── hooks/
│       │   └── useSimulation.ts  # RAF-driven training loop, state management
│       └── App.tsx
└── backend/
    ├── main.py                   # FastAPI app, CORS, router registration
    ├── database.py               # SQLAlchemy session factory
    ├── core/
    │   ├── config.py             # Pydantic settings
    │   └── security.py           # JWT encode/decode, bcrypt
    ├── models/                   # SQLAlchemy ORM models
    └── routers/
        ├── auth.py               # Register, login, token validation
        ├── leaderboard.py        # GET top 20, POST score submission
        ├── grids.py              # Save/load custom grids per user
        └── weights.py            # Serve pre-trained elite agent weights
```

---

## RL Implementation Notes

**Q-Learning (Off-Policy)**
Updates toward the greedy max-Q next action regardless of the action actually taken. Tends to converge faster but can be unstable early in training when Q-values are noisy.

**SARSA (On-Policy)**
Updates toward the Q-value of the action actually selected (including exploratory actions). More conservative — learns a safer policy under ε-greedy exploration.

**Reward Model**
| Cell | Reward |
|---|---|
| Empty | -0.01 (step cost) |
| Wall collision | -1.0 (bounce back) |
| Mud | -0.5 |
| Trap | -1.0 (terminal) |
| Goal | +10.0 (terminal) |

The step cost is intentional — it forces the agent to find the *shortest* path rather than any path.

---

## Running Locally

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend
pip install -r requirements.txt
# Set DATABASE_URL and SECRET_KEY in .env
uvicorn main:app --reload
```

---

## Resume Bullet

*Built full-stack RL simulation sandbox with client-side Q-Learning and SARSA engines in TypeScript, Canvas-rendered Q-value heatmaps, FastAPI/PostgreSQL backend for auth and leaderboard, deployed on Vercel + Render*
