import { useState, useCallback } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { GridCanvas } from './components/GridCanvas';
import type { CellType } from './engine/types';

type DrawTool = CellType | 'erase';

const TOOLS: { type: DrawTool; label: string }[] = [
  { type: 'wall',  label: '🧱 Wall' },
  { type: 'trap',  label: '💀 Trap' },
  { type: 'mud',   label: '🌊 Mud' },
  { type: 'erase', label: '✏️ Erase' },
];

export default function App() {
  const sim = useSimulation();
  const [activeTool, setActiveTool] = useState<DrawTool>('wall');

  const handleCellClick = useCallback((row: number, col: number) => {
    const type: CellType = activeTool === 'erase' ? 'empty' : activeTool;
    sim.updateCell(row, col, type);
  }, [activeTool, sim]);

  const avgSteps = sim.stats.stepsToGoal.length > 0
    ? Math.round(sim.stats.stepsToGoal.slice(-20).reduce((a, b) => a + b, 0) / Math.min(sim.stats.stepsToGoal.length, 20))
    : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e2e8f0', fontFamily: '"Inter", system-ui, sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto 32px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: '#e0e7ff' }}>RL Sandbox</h1>
          <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace' }}>simulation engine</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Draw walls & traps, then watch agents learn in real-time. 100% client-side compute.</p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['qlearning', 'sarsa'] as const).map(algo => (
              <button key={algo} onClick={() => { sim.setAlgorithm(algo); sim.reset(); }}
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: sim.algorithm === algo ? '#4f46e5' : '#1e293b',
                  color: sim.algorithm === algo ? '#fff' : '#94a3b8' }}>
                {algo === 'qlearning' ? 'Q-Learning' : 'SARSA'}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={sim.reset}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #1e293b', background: 'transparent', color: '#64748b', fontSize: 13, cursor: 'pointer' }}>
              Reset
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {TOOLS.map(tool => (
              <button key={tool.type} onClick={() => setActiveTool(tool.type)}
                style={{ padding: '5px 12px', borderRadius: 5, fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${activeTool === tool.type ? '#4f46e5' : '#1e293b'}`,
                  background: activeTool === tool.type ? '#1e1b4b' : 'transparent',
                  color: activeTool === tool.type ? '#a5b4fc' : '#64748b' }}>
                {tool.label}
              </button>
            ))}
          </div>

          <div style={{ background: '#0f172a', borderRadius: 10, padding: 12, border: '1px solid #1e293b' }}>
            <GridCanvas env={sim.env} agentPos={sim.agentPos} bestPath={sim.bestPath} qTable={sim.qTable} onCellClick={handleCellClick} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={sim.running ? sim.pause : sim.start}
              style={{ padding: '10px 28px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                background: sim.running ? '#dc2626' : '#4f46e5', color: '#fff' }}>
              {sim.running ? '⏸ Pause' : '▶ Train'}
            </button>
            <button onClick={sim.reset}
              style={{ padding: '10px 20px', borderRadius: 7, border: '1px solid #1e293b', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ↺ Reset Agent
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#0f172a', borderRadius: 10, padding: 20, border: '1px solid #1e293b' }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#475569', textTransform: 'uppercase' }}>Live Metrics</p>
            {[
              { label: 'Episode', value: sim.stats.episode.toLocaleString() },
              { label: 'Success Rate', value: `${sim.stats.successRate}%` },
              { label: 'Avg Steps (last 20)', value: String(avgSteps) },
              { label: 'Epsilon (ε)', value: sim.epsilon.toFixed(4) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#818cf8', fontFamily: 'monospace' }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#0f172a', borderRadius: 10, padding: 20, border: '1px solid #1e293b' }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#475569', textTransform: 'uppercase' }}>Hyperparameters</p>
            {([
              { key: 'alpha' as const, label: 'Learning Rate (α)', min: 0.01, max: 1, step: 0.01 },
              { key: 'gamma' as const, label: 'Discount (γ)', min: 0.1, max: 0.999, step: 0.001 },
              { key: 'epsilonDecay' as const, label: 'ε Decay', min: 0.99, max: 0.9999, step: 0.0001 },
            ]).map(({ key, label, min, max, step }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#a5b4fc' }}>{sim.params[key]}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={sim.params[key]}
                  onChange={e => sim.setParams(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#4f46e5' }} />
              </div>
            ))}
          </div>

          <div style={{ background: '#0f172a', borderRadius: 10, padding: 16, border: '1px solid #1e293b' }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#475569', textTransform: 'uppercase' }}>Legend</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { color: '#818cf8', label: 'Agent' },
                { color: 'rgba(34,211,238,0.5)', label: 'Best Path' },
                { color: 'rgba(99,102,241,0.35)', label: 'Q-Value Heat' },
                { color: '#334155', label: 'Wall' },
                { color: '#991b1b', label: 'Trap' },
                { color: '#92400e', label: 'Mud' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}