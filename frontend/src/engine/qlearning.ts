import type { QTable, Action, HyperParams } from './types';
import { ACTIONS } from './types';
import type { GridEnvironment } from './environment';

export class QLearningAgent {
  qTable: QTable = {};
  params: HyperParams;
  epsilon: number;

  constructor(params: HyperParams) { this.params = params; this.epsilon = params.epsilon; }

  private getQ(state: string): number[] {
    if (!this.qTable[state]) this.qTable[state] = new Array(4).fill(0);
    return this.qTable[state];
  }

  selectAction(state: string): Action {
    if (Math.random() < this.epsilon) return ACTIONS[Math.floor(Math.random() * 4)] as Action;
    const q = this.getQ(state);
    return q.indexOf(Math.max(...q)) as Action;
  }

  update(state: string, action: Action, reward: number, nextState: string, done: boolean): void {
    const { alpha, gamma } = this.params;
    const q = this.getQ(state);
    const nextQ = this.getQ(nextState);
    const target = done ? reward : reward + gamma * Math.max(...nextQ);
    q[action] += alpha * (target - q[action]);
  }

  decayEpsilon() { this.epsilon = Math.max(this.params.epsilonMin, this.epsilon * this.params.epsilonDecay); }

  runEpisode(env: GridEnvironment): { steps: number; totalReward: number; path: [number,number][]; success: boolean } {
    let { row, col } = { row: env.startPos[0], col: env.startPos[1] };
    let totalReward = 0;
    const path: [number,number][] = [[row, col]];
    for (let step = 0; step < this.params.maxSteps; step++) {
      const state = env.stateKey(row, col);
      const action = this.selectAction(state);
      const { nextRow, nextCol, reward, done } = env.step(row, col, action);
      this.update(state, action, reward, env.stateKey(nextRow, nextCol), done);
      row = nextRow; col = nextCol; totalReward += reward;
      path.push([row, col]);
      if (done) { this.decayEpsilon(); return { steps: step + 1, totalReward, path, success: env.grid[row][col].type === 'goal' }; }
    }
    this.decayEpsilon();
    return { steps: this.params.maxSteps, totalReward, path, success: false };
  }

  reset() { this.qTable = {}; this.epsilon = this.params.epsilon; }

  getBestPath(env: GridEnvironment): [number,number][] {
    let { row, col } = { row: env.startPos[0], col: env.startPos[1] };
    const path: [number,number][] = [[row, col]];
    const visited = new Set<string>();
    for (let i = 0; i < env.rows * env.cols * 2; i++) {
      const state = env.stateKey(row, col);
      if (visited.has(state)) break;
      visited.add(state);
      const q = this.getQ(state);
      const action = q.indexOf(Math.max(...q)) as Action;
      const { nextRow, nextCol, done } = env.step(row, col, action);
      row = nextRow; col = nextCol; path.push([row, col]);
      if (done) break;
    }
    return path;
  }
}