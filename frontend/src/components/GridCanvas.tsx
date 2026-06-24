import { useRef, useEffect, useCallback } from 'react';
import { GridEnvironment } from '../engine/environment';
import type { QTable } from '../engine/types';

const CELL_COLORS: Record<string, string> = {
  empty: '#0f172a', wall: '#1e293b', trap: '#7f1d1d', mud: '#78350f', goal: '#14532d', start: '#1e3a5f',
};

interface Props {
  env: GridEnvironment;
  agentPos: [number, number];
  bestPath: [number, number][];
  qTable: QTable;
  onCellClick: (row: number, col: number) => void;
}

export function GridCanvas({ env, agentPos, bestPath, qTable, onCellClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const CELL_SIZE = Math.min(Math.floor(560 / env.cols), Math.floor(560 / env.rows));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = env.cols * CELL_SIZE;
    canvas.height = env.rows * CELL_SIZE;
    const pathSet = new Set(bestPath.map(([r, c]) => `${r},${c}`));

    for (let r = 0; r < env.rows; r++) {
      for (let c = 0; c < env.cols; c++) {
        const cell = env.grid[r][c];
        const x = c * CELL_SIZE, y = r * CELL_SIZE;
        const key = `${r},${c}`;

        ctx.fillStyle = CELL_COLORS[cell.type] ?? '#0f172a';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        if (cell.type === 'empty' || cell.type === 'start') {
          const q = qTable[key];
          if (q) {
            const maxQ = Math.max(...q);
            const intensity = Math.min(Math.max((maxQ + 1) / 2, 0), 1);
            if (intensity > 0.05) {
              ctx.fillStyle = `rgba(99, 102, 241, ${intensity * 0.4})`;
              ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            }
          }
        }

        if (pathSet.has(key) && cell.type !== 'start' && cell.type !== 'goal') {
          ctx.fillStyle = 'rgba(34, 211, 238, 0.18)';
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 0.25, y + 0.25, CELL_SIZE - 0.5, CELL_SIZE - 0.5);

        ctx.font = `${CELL_SIZE * 0.48}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (cell.type === 'trap') ctx.fillText('💀', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        if (cell.type === 'mud')  ctx.fillText('🌊', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        if (cell.type === 'goal') ctx.fillText('🎯', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        if (cell.type === 'start') ctx.fillText('🤖', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
      }
    }

    const [ar, ac] = agentPos;
    if (env.grid[ar]?.[ac]?.type !== 'start') {
      const ax = ac * CELL_SIZE + CELL_SIZE / 2, ay = ar * CELL_SIZE + CELL_SIZE / 2;
      const rad = CELL_SIZE * 0.3;
      const grd = ctx.createRadialGradient(ax, ay, 0, ax, ay, rad * 2);
      grd.addColorStop(0, 'rgba(129, 140, 248, 0.5)');
      grd.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(ax, ay, rad * 2, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(ax, ay, rad, 0, Math.PI * 2);
      ctx.fillStyle = '#818cf8'; ctx.fill();
      ctx.strokeStyle = '#e0e7ff'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }, [env, agentPos, bestPath, qTable, CELL_SIZE]);

  useEffect(() => { draw(); }, [draw]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) * (canvasRef.current!.width / rect.width) / CELL_SIZE);
    const row = Math.floor((e.clientY - rect.top) * (canvasRef.current!.height / rect.height) / CELL_SIZE);
    if (row >= 0 && row < env.rows && col >= 0 && col < env.cols) onCellClick(row, col);
  }, [CELL_SIZE, env, onCellClick]);

  return (
    <canvas ref={canvasRef} onClick={handleClick}
      style={{ width: '100%', maxWidth: 560, cursor: 'crosshair', borderRadius: 6, display: 'block' }} />
  );
}