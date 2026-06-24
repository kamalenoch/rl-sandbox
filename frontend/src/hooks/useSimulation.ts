import { useState, useRef, useCallback, useEffect } from 'react';
import { GridEnvironment } from '../engine/environment';
import { QLearningAgent } from '../engine/qlearning';
import { SARSAAgent } from '../engine/sarsa';
import type { HyperParams, Algorithm, SimStats, QTable, CellType } from '../engine/types';

const DEFAULT_PARAMS: HyperParams = {
  alpha: 0.1, gamma: 0.99, epsilon: 1.0, epsilonDecay: 0.995,
  epsilonMin: 0.01, maxSteps: 200, speed: 0,
};

export function useSimulation() {
  const [env, setEnv] = useState(() => {
    const e = new GridEnvironment(10, 10);
    e.loadPreset('maze');
    return e;
  });
  const [params, setParams] = useState<HyperParams>(DEFAULT_PARAMS);
  const [algorithm, setAlgorithm] = useState<Algorithm>('qlearning');
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<SimStats>({ episode: 0, stepsToGoal: [], rewardsPerEpisode: [], successRate: 0 });
  const [agentPos, setAgentPos] = useState<[number, number]>([0, 0]);
  const [bestPath, setBestPath] = useState<[number, number][]>([]);
  const [qTable, setQTable] = useState<QTable>({});
  const [epsilon, setEpsilon] = useState(1.0);

  const agentRef = useRef<QLearningAgent | SARSAAgent | null>(null);
  const envRef = useRef(env);
  const runningRef = useRef(false);
  const frameRef = useRef<number>(0);
  const paramsRef = useRef(params);
  const algorithmRef = useRef(algorithm);

  useEffect(() => { envRef.current = env; }, [env]);
  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => { algorithmRef.current = algorithm; }, [algorithm]);

  const initAgent = useCallback(() => {
    agentRef.current = algorithmRef.current === 'qlearning'
      ? new QLearningAgent(paramsRef.current)
      : new SARSAAgent(paramsRef.current);
  }, []);

  const runBatch = useCallback((batchSize = 20) => {
    if (!agentRef.current || !runningRef.current) return;
    const agent = agentRef.current;
    const currentEnv = envRef.current;
    for (let i = 0; i < batchSize; i++) {
      const result = agent.runEpisode(currentEnv);
      setStats(prev => {
        const newRewards = [...prev.rewardsPerEpisode, result.totalReward].slice(-200);
        const newSteps = result.success ? [...prev.stepsToGoal, result.steps].slice(-200) : prev.stepsToGoal;
        return {
          episode: prev.episode + 1,
          stepsToGoal: newSteps,
          rewardsPerEpisode: newRewards,
          successRate: Math.round((newSteps.length / Math.min(prev.episode + 1, 200)) * 100),
        };
      });
    }
    const path = agent.getBestPath(currentEnv);
    setBestPath(path);
    setAgentPos(path[path.length - 1] ?? [0, 0]);
    setQTable({ ...agent.qTable });
    setEpsilon(agent.epsilon);
    frameRef.current = requestAnimationFrame(() => runBatch(batchSize));
  }, []);

  const start = useCallback(() => {
    if (runningRef.current) return;
    if (!agentRef.current) initAgent();
    runningRef.current = true;
    setRunning(true);
    frameRef.current = requestAnimationFrame(() => runBatch(20));
  }, [initAgent, runBatch]);

  const pause = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  const reset = useCallback(() => {
    pause();
    initAgent();
    setStats({ episode: 0, stepsToGoal: [], rewardsPerEpisode: [], successRate: 0 });
    setAgentPos([envRef.current.startPos[0], envRef.current.startPos[1]]);
    setBestPath([]);
    setQTable({});
    setEpsilon(paramsRef.current.epsilon);
  }, [pause, initAgent]);

  const updateCell = useCallback((row: number, col: number, type: CellType) => {
    setEnv(prev => {
      const next = prev.clone();
      next.setCell(row, col, type);
      return next;
    });
  }, []);

  const deployEliteAgent = useCallback((weights: QTable) => {
    pause();
    initAgent();
    agentRef.current!.qTable = weights;
    agentRef.current!.epsilon = 0;
    const path = agentRef.current!.getBestPath(envRef.current);
    setBestPath(path);
    setAgentPos(path[path.length - 1] ?? [0, 0]);
  }, [pause, initAgent]);

  return {
    env, params, setParams, algorithm, setAlgorithm,
    running, stats, agentPos, bestPath, qTable, epsilon,
    start, pause, reset, updateCell, deployEliteAgent,
  };
}