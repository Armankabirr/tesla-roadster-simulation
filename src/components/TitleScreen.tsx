import React from 'react';
import { Zap, Rocket, Compass, Play, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { GameMode } from '../game/GameEngine.ts';

interface TitleScreenProps {
  onStart: (mode: GameMode) => void;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  selectedMode,
  onSelectMode,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 pointer-events-none select-none z-20">
      {/* Top Header & Brand Lockup */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-widest bg-red-600/90 text-white uppercase font-mono">
              2026 SPEC
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-widest bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase font-mono">
              SPACEX THRUSTER PACKAGE
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white font-['Chakra_Petch',sans-serif] uppercase drop-shadow-[0_4px_16px_rgba(239,68,68,0.5)]">
            TESLA ROADSTER
          </h1>
          <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm tracking-widest uppercase">
            <span>0-60 &lt; 0.99s</span>
            <span>•</span>
            <span>PLAID SPEED 250+ MPH</span>
            <span>•</span>
            <span>10 COLD-GAS ROCKETS</span>
          </div>
        </div>

        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className="pointer-events-auto p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
          title="Toggle Audio"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Center Hero Mode Selector */}
      <div className="self-center w-full max-w-2xl bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-6 pointer-events-auto shadow-2xl">
        <div className="text-xs uppercase tracking-widest text-zinc-400 font-mono mb-3 flex items-center justify-between">
          <span>SELECT MISSION MODE</span>
          <span className="text-red-500 font-bold">NEXT-GEN ELECTRIC BEAST</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {/* Mode 1: Police Chase */}
          <button
            onClick={() => onSelectMode('chase')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedMode === 'chase'
                ? 'bg-red-950/40 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 text-red-400">
              <Zap className="w-5 h-5" />
              <span className="font-bold font-['Chakra_Petch',sans-serif] tracking-wide">1. POLICE CHASE</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              2 Police Interceptor cruisers and an air chopper chasing with searchlight & sirens! Leap over cruisers with SpaceX thrusters.
            </p>
          </button>

          {/* Mode 2: Normal Driving in Real Environment */}
          <button
            onClick={() => onSelectMode('freedrive')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedMode === 'freedrive'
                ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <Compass className="w-5 h-5" />
              <span className="font-bold font-['Chakra_Petch',sans-serif] tracking-wide">2. SCENIC FREE DRIVE</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Normal driving in realistic coastal canyon environment. Cruise past traffic, test handling, and reach 250+ mph.
            </p>
          </button>

          {/* Mode 3: 0-60 Drag Strip */}
          <button
            onClick={() => onSelectMode('drag')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedMode === 'drag'
                ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <Rocket className="w-5 h-5" />
              <span className="font-bold font-['Chakra_Petch',sans-serif] tracking-wide">3. 0-60 PLAID DRAG</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Precision launch control! Fire SpaceX cold-gas thrusters to achieve sub-1-second 0-60 and 1/4 mile times.
            </p>
          </button>
        </div>

        {/* Start Button */}
        <button
          onClick={() => onStart(selectedMode)}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-cyan-500 hover:from-red-500 hover:to-cyan-400 text-white font-['Chakra_Petch',sans-serif] font-black text-xl tracking-wider uppercase flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>LAUNCH ROADSTER [ SPACE / ENTER ]</span>
        </button>
      </div>

      {/* Bottom Hint Line */}
      <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-4">
          <span>WASD / ARROWS : STEER & THROTTLE</span>
          <span>•</span>
          <span>SPACE : SPACEX COLD-GAS THRUSTERS</span>
          <span>•</span>
          <span>C : CAMERA</span>
          <span>•</span>
          <span>F : FSD VISION</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>REALTIME 3D PROCEDURAL SIMULATION</span>
        </div>
      </div>
    </div>
  );
};
