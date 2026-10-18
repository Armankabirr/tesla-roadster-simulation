import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Gauge, Zap, Compass } from 'lucide-react';
import { GameMode } from '../game/GameEngine.ts';

interface GameOverModalProps {
  reason: string;
  finalScore: number;
  distanceMeters: number;
  topSpeedMph: number;
  gameMode: GameMode;
  onRestart: () => void;
  onSelectMode: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  reason,
  finalScore,
  distanceMeters,
  topSpeedMph,
  gameMode,
  onRestart,
  onSelectMode,
}) => {
  useEffect(() => {
    // If completed high score or finished drag, launch confetti
    if (finalScore > 2000 || gameMode === 'drag') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#06b6d4', '#a855f7', '#ffffff'],
      });
    }
  }, [finalScore, gameMode]);

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-40 select-none">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800">
            {reason}
          </span>
          <span className="text-xs font-mono text-zinc-500 uppercase">
            2026 ROADSTER TELEMETRY
          </span>
        </div>

        <h2 className="text-3xl font-black italic tracking-tighter text-white font-['Chakra_Petch',sans-serif] uppercase mb-4">
          MISSION REPORT
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 font-mono">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>FINAL SCORE</span>
            </div>
            <div className="text-2xl font-black text-white tabular-nums">
              {finalScore.toLocaleString()}
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>TOP SPEED</span>
            </div>
            <div className="text-2xl font-black text-white tabular-nums">
              {topSpeedMph} <span className="text-xs text-zinc-500">MPH</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>DISTANCE</span>
            </div>
            <div className="text-2xl font-black text-white tabular-nums">
              {distanceMeters.toLocaleString()} <span className="text-xs text-zinc-500">M</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <Compass className="w-3.5 h-3.5 text-red-400" />
              <span>PROPULSION</span>
            </div>
            <div className="text-lg font-bold text-white uppercase">
              SPACEX COLD-GAS
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-cyan-600 hover:from-red-500 hover:to-cyan-500 text-white font-['Chakra_Petch',sans-serif] font-black text-lg tracking-wider uppercase flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RE-LAUNCH ROADSTER [ENTER]</span>
          </button>

          <button
            onClick={onSelectMode}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            RETURN TO MISSION SELECT
          </button>
        </div>
      </div>
    </div>
  );
};
