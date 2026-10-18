import React, { useState } from 'react';
import { ROADSTER_COLORS, RoadsterColorConfig } from '../game/RoadsterModel.ts';
import { CameraView } from '../game/GameEngine.ts';
import { Palette, Camera, ChevronDown, ChevronUp, Music } from 'lucide-react';
import { sound } from '../audio/soundEngine.ts';

interface CustomizerDockProps {
  currentColorId: string;
  onSelectColor: (colorId: string) => void;
  currentCameraView: CameraView;
  onSelectCameraView: (view: CameraView) => void;
}

export const CustomizerDock: React.FC<CustomizerDockProps> = ({
  currentColorId,
  onSelectColor,
  currentCameraView,
  onSelectCameraView,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  const toggleMusic = () => {
    const nextState = sound.toggleMusic();
    setIsMusicPlaying(nextState);
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30 pointer-events-none flex flex-col items-center">
      {/* Collapse / Expand Toggle Tab */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="pointer-events-auto px-4 py-1.5 rounded-t-xl bg-zinc-950/90 border-t border-x border-zinc-800 text-zinc-400 hover:text-white text-xs font-mono tracking-wider uppercase flex items-center gap-1.5 cursor-pointer shadow-lg transition-colors"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>CUSTOMIZER & CAMERA [H]</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>HIDE DOCK [H]</span>
          </>
        )}
      </button>

      {/* Main Unified Dock Panel */}
      {!isCollapsed && (
        <div className="w-full pointer-events-auto bg-zinc-950/95 border border-zinc-800 rounded-b-2xl rounded-t-lg p-3 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          {/* 1. Paint Finishes */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-xs font-mono uppercase flex items-center gap-1 mr-1">
              <Palette className="w-3.5 h-3.5 text-zinc-400" />
              <span>FINISH</span>
            </span>

            <div className="flex items-center gap-1.5">
              {ROADSTER_COLORS.map((cfg: RoadsterColorConfig) => {
                const isSelected = cfg.id === currentColorId;
                return (
                  <button
                    key={cfg.id}
                    onClick={() => onSelectColor(cfg.id)}
                    className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-zinc-900 text-white'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                    title={cfg.name}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: `#${cfg.hex.toString(16).padStart(6, '0')}` }}
                    />
                    <span className="hidden sm:inline">{cfg.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Camera View & Synthwave Music */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-xs font-mono uppercase flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-zinc-400" />
            </span>

            <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
              {(['chase', 'cockpit', 'drone'] as CameraView[]).map((view) => (
                <button
                  key={view}
                  onClick={() => onSelectCameraView(view)}
                  className={`px-2.5 py-1 rounded text-xs font-mono uppercase cursor-pointer transition-colors ${
                    currentCameraView === view
                      ? 'bg-zinc-800 text-cyan-400 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Synthwave Beat Toggle */}
            <button
              onClick={toggleMusic}
              className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                isMusicPlaying
                  ? 'bg-cyan-950/70 border-cyan-700 text-cyan-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
              title="Toggle Dynamic Synthwave Beat"
            >
              <Music className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isMusicPlaying ? 'BEAT ON' : 'BEAT OFF'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
