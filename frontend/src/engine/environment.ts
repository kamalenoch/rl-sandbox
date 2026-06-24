import type { Cell, CellType, Action, AgentState } from './types';
import { ACTION_DELTAS } from './types';

export const CELL_REWARDS: Record<CellType, number> = {
  empty: -0.01, wall: -1.0, trap: -1.0, mud: -0.5, goal: 10.0, start: -0.01,
};

export class GridEnvironment {
  grid: Cell[][];
  rows: number;
  cols: number;
  startPos: [number, number];
  goalPos: [number, number];

  constructor(rows: number, cols: number) {
    this.rows = rows; this.cols = cols;
    this.startPos = [0, 0]; this.goalPos = [rows - 1, cols - 1];
    this.grid = this.initGrid();
  }

  private initGrid(): Cell[][] {
    return Array.from({ length: this.rows }, (_, r) =>
      Array.from({ length: this.cols }, (_, c) => {
        if (r === this.startPos[0] && c === this.startPos[1]) return { type: 'start' as CellType, reward: CELL_REWARDS.start };
        if (r === this.goalPos[0] && c === this.goalPos[1]) return { type: 'goal' as CellType, reward: CELL_REWARDS.goal };
        return { type: 'empty' as CellType, reward: CELL_REWARDS.empty };
      })
    );
  }

  setCell(row: number, col: number, type: CellType) {
    if (row === this.goalPos[0] && col === this.goalPos[1]) return;
    if (row === this.startPos[0] && col === this.startPos[1]) return;
    this.grid[row][col] = { type, reward: CELL_REWARDS[type] };
  }

  stateKey(row: number, col: number): string { return `${row},${col}`; }

  reset(): AgentState {
    return { row: this.startPos[0], col: this.startPos[1], episode: 0, step: 0, totalReward: 0, epsilon: 1.0, isAlive: true };
  }

  step(row: number, col: number, action: Action): { nextRow: number; nextCol: number; reward: number; done: boolean } {
    const [dr, dc] = ACTION_DELTAS[action];
    const nextRow = row + dr, nextCol = col + dc;
    if (nextRow < 0 || nextRow >= this.rows || nextCol < 0 || nextCol >= this.cols)
      return { nextRow: row, nextCol: col, reward: -0.5, done: false };
    const cell = this.grid[nextRow][nextCol];
    if (cell.type === 'wall') return { nextRow: row, nextCol: col, reward: -1.0, done: false };
    return { nextRow, nextCol, reward: cell.reward, done: cell.type === 'goal' || cell.type === 'trap' };
  }

  loadPreset(name: string) {
    this.grid = this.initGrid();
    if (name === 'maze') {
      const walls: [number, number][] = [[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[2,8],[4,0],[6,1],[6,5],[7,3],[7,7]];
      walls.forEach(([r,c]) => { if (r < this.rows && c < this.cols) this.setCell(r, c, 'wall'); });
      [[4,4],[6,8],[2,2]].forEach(([r,c]) => { if (r < this.rows && c < this.cols) this.setCell(r, c, 'trap'); });
      [[3,0],[5,1],[7,5]].forEach(([r,c]) => { if (r < this.rows && c < this.cols) this.setCell(r, c, 'mud'); });
    }
  }

  clone(): GridEnvironment {
    const env = new GridEnvironment(this.rows, this.cols);
    env.grid = this.grid.map(row => row.map(cell => ({ ...cell })));
    env.startPos = [...this.startPos] as [number, number];
    env.goalPos = [...this.goalPos] as [number, number];
    return env;
  }
}