import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExitToMenu,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-4 z-40 select-none">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="text-xs text-zinc-500 font-mono tracking-widest uppercase mb-1">
          SYSTEM SUSPENDED
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter text-white font-['Chakra_Petch',sans-serif] uppercase mb-6">
          GAME PAUSED
        </h2>

        {/* Controls Quick Reference */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 mb-6 font-mono text-xs text-zinc-400 space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">STEER & GAS:</span>
            <span className="text-zinc-200">W A S D / ARROWS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">SPACEX JUMP/BOOST:</span>
            <span className="text-cyan-400 font-bold">SPACEBAR</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">CHANGE CAMERA:</span>
            <span className="text-zinc-200">C KEY</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">FSD VISION:</span>
            <span className="text-zinc-200">F KEY</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-['Chakra_Petch',sans-serif] font-black text-lg tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME MISSION [ESC]</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RUN</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={onExitToMenu}
            className="w-full py-2 rounded-xl text-zinc-500 hover:text-zinc-300 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors mt-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>RETURN TO MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
