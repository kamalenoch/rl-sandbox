export type CellType = 'empty' | 'wall' | 'trap' | 'mud' | 'goal' | 'start';

export interface Cell {
  type: CellType;
  reward: number;
}

export type Action = 0 | 1 | 2 | 3;
export const ACTIONS: Action[] = [0, 1, 2, 3];
export const ACTION_LABELS = ['↑', '↓', '←', '→'];
export const ACTION_DELTAS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export interface AgentState {
  row: number;
  col: number;
  episode: number;
  step: number;
  totalReward: number;
  epsilon: number;
  isAlive: boolean;
}

export interface HyperParams {
  alpha: number;
  gamma: number;
  epsilon: number;
  epsilonDecay: number;
  epsilonMin: number;
  maxSteps: number;
  speed: number;
}

export interface QTable {
  [stateKey: string]: number[];
}

export interface SimStats {
  episode: number;
  stepsToGoal: number[];
  rewardsPerEpisode: number[];
  successRate: number;
}

export type Algorithm = 'qlearning' | 'sarsa';