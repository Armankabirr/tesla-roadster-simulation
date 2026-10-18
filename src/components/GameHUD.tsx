import React from 'react';
import { TelemetryData } from '../game/GameEngine.ts';
import { Camera, Eye, Pause, Volume2, VolumeX, Flame, Zap, ArrowLeft, ArrowRight } from 'lucide-react';

interface GameHUDProps {
  telemetry: TelemetryData | null;
  onPause: () => void;
  onCycleCamera: () => void;
  onToggleFSD: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  // Mobile virtual controls callbacks
  onInputStart: (action: 'throttle' | 'brake' | 'left' | 'right' | 'thruster') => void;
  onInputEnd: (action: 'throttle' | 'brake' | 'left' | 'right' | 'thruster') => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  telemetry,
  onPause,
  onCycleCamera,
  onToggleFSD,
  isMuted,
  onToggleMute,
  onInputStart,
  onInputEnd,
}) => {
  if (!telemetry) return null;

  const {
    speedMph,
    gear,
    batteryPct,
    thrusterFuelPct,
    gForce,
    score,
    distanceMeters,
    multiplier,
    nearMissCount,
    isPlaidActive,
    isThrusterActive,
    cameraView,
    fsdVisionActive,
    gameMode,
    dragStats,
    dragCountdownState,
    dragCountdownStep,
  } = telemetry;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* 1. FSD Vision Overlay (Cyberpunk Augmented Reality Grid) */}
      {fsdVisionActive && (
        <div className="absolute inset-0 pointer-events-none border border-cyan-500/20">
          {/* Scanning lines */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-1 rounded bg-black/80 border border-cyan-500 text-cyan-400 font-mono text-xs tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>TESLA FSD V14.2 // NEURAL VISION ACTIVATED</span>
          </div>
          {/* Center aiming reticle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-cyan-500/30 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
          </div>
        </div>
      )}

      {/* 2. Top Bar: Telemetry Clusters & Actions */}
      <div className="flex items-start justify-between">
        {/* Speedometer & Gear Cluster */}
        <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-4 min-w-[190px] shadow-lg">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl font-black italic tracking-tighter text-white font-['Chakra_Petch',sans-serif] tabular-nums leading-none">
              {speedMph}
            </span>
            <span className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">
              MPH
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">MODE:</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded ${
                  isPlaidActive
                    ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                    : 'bg-zinc-800 text-cyan-400'
                }`}
              >
                {gear}
              </span>
            </div>
            <div className="flex items-center gap-1 text-zinc-400">
              <span>{gForce}</span>
              <span className="text-zinc-600 font-bold">G</span>
            </div>
          </div>
        </div>

        {/* Center: Drag Challenge Timer & Tree (In Drag Mode) */}
        {gameMode === 'drag' && (
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center min-w-[240px] shadow-2xl">
            {dragCountdownState === 'countdown' && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-zinc-400 font-mono tracking-widest uppercase mb-2">
                  LAUNCH STAGING
                </span>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 ${dragCountdownStep <= 3 ? 'bg-amber-500 border-amber-400' : 'bg-zinc-800 border-zinc-700'}`} />
                  <div className={`w-6 h-6 rounded-full border-2 ${dragCountdownStep <= 2 ? 'bg-amber-500 border-amber-400' : 'bg-zinc-800 border-zinc-700'}`} />
                  <div className={`w-6 h-6 rounded-full border-2 ${dragCountdownStep <= 1 ? 'bg-amber-500 border-amber-400' : 'bg-zinc-800 border-zinc-700'}`} />
                </div>
              </div>
            )}

            {dragCountdownState === 'go' && (
              <div className="flex flex-col items-center">
                <div className="px-3 py-1 rounded bg-green-500 text-black font-black text-xs tracking-widest uppercase font-mono mb-2">
                  LAUNCH // ACCELERATE!
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
                  <span className="text-zinc-400">0-60 TIME:</span>
                  <span className="text-cyan-400 font-bold tabular-nums">
                    {dragStats.zeroToSixtySec ? `${dragStats.zeroToSixtySec}s` : 'MEASURING...'}
                  </span>
                  <span className="text-zinc-400">0-100 TIME:</span>
                  <span className="text-cyan-400 font-bold tabular-nums">
                    {dragStats.zeroToHundredSec ? `${dragStats.zeroToHundredSec}s` : '...'}
                  </span>
                </div>
              </div>
            )}

            {dragCountdownState === 'finished' && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-green-400 font-mono font-bold tracking-widest uppercase mb-1">
                  1/4 MILE COMPLETED
                </span>
                <div className="text-2xl font-black text-white font-['Chakra_Petch',sans-serif] tabular-nums">
                  {dragStats.quarterMileSec}s @ {dragStats.quarterMileSpeedMph} MPH
                </div>
                <div className="text-xs text-cyan-400 font-mono mt-1">
                  0-60: {dragStats.zeroToSixtySec}s · PEAK: {dragStats.peakGForce}G
                </div>
              </div>
            )}
          </div>
        )}

        {/* Center: Police Pursuit & Chopper Tracking Status (In Endless / Free Roam) */}
        {gameMode !== 'drag' && (
          <div className="hidden sm:flex bg-zinc-950/85 border border-zinc-800 rounded-2xl p-3 flex-col items-center min-w-[260px] shadow-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  telemetry.pursuitStatus === 'PURSUIT ACTIVE'
                    ? 'bg-red-500'
                    : telemetry.pursuitStatus === 'EVADING'
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
              />
              <span
                className={`text-xs font-mono font-black tracking-widest uppercase ${
                  telemetry.pursuitStatus === 'PURSUIT ACTIVE'
                    ? 'text-red-400'
                    : telemetry.pursuitStatus === 'EVADING'
                    ? 'text-amber-400'
                    : 'text-cyan-400'
                }`}
              >
                {telemetry.pursuitStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] font-mono text-zinc-400 w-full text-center">
              <div>
                <span className="text-zinc-500">2 CRUISERS: </span>
                <span className="text-white font-bold tabular-nums">
                  {telemetry.closestPoliceDist < 120 ? `${telemetry.closestPoliceDist}m` : 'OUTRUN'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">CHOPPER: </span>
                <span className="text-cyan-300 font-bold tabular-nums">
                  {telemetry.helicopterDist < 120 ? `${telemetry.helicopterDist}m` : 'OVERHEAD'}
                </span>
              </div>
            </div>

            {telemetry.closestPoliceDist < 40 && (
              <div className="mt-1 text-[10px] text-amber-300 font-mono font-bold tracking-tight">
                ⚠️ CRUIsERS CLOSING IN! [SPACE] TO ROCKET JUMP
              </div>
            )}
          </div>
        )}

        {/* Top-Right: Score, Distance & Multiplier (In Chase & Free Drive Modes) */}
        {(gameMode === 'chase' || gameMode === 'freedrive') && (
          <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-4 min-w-[190px] shadow-lg text-right">
            <div className="text-xs text-zinc-400 font-mono tracking-widest uppercase">
              SCORE
            </div>
            <div className="text-3xl font-black text-white font-['Chakra_Petch',sans-serif] tabular-nums">
              {score.toLocaleString()}
            </div>

            <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold">
                {multiplier}x
              </span>
              <span className="text-zinc-400 tabular-nums">
                {distanceMeters.toLocaleString()} M
              </span>
            </div>
          </div>
        )}

        {/* Action Controls Cluster */}
        <div className="flex items-center gap-2 pointer-events-auto ml-3">
          <button
            onClick={onCycleCamera}
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title={`Camera: ${cameraView}`}
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleFSD}
            className={`p-2.5 rounded-xl border transition-colors ${
              fsdVisionActive
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Toggle FSD Vision"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Mute/Unmute"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onPause}
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Pause"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Bottom Dashboard: Battery & SpaceX Thrusters */}
      <div className="self-center w-full max-w-lg mb-2 flex flex-col items-center">
        <div className="w-full bg-zinc-950/85 border border-zinc-800/90 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5">
          {/* Battery Status */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>BATTERY ENERGY</span>
              </span>
              <span className="text-white font-mono tabular-nums">{batteryPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-150"
                style={{ width: `${batteryPct}%` }}
              />
            </div>
          </div>

          {/* SpaceX Cold-Gas Thrusters Status */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>SPACEX COLD-GAS ROCKET THRUSTERS</span>
              </span>
              <span
                className={`font-mono tabular-nums ${
                  isThrusterActive ? 'text-purple-300 font-bold' : 'text-zinc-400'
                }`}
              >
                {thrusterFuelPct}% {isThrusterActive && '[FIRING]'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  isThrusterActive
                    ? 'bg-gradient-to-r from-purple-500 via-cyan-400 to-white'
                    : 'bg-gradient-to-r from-purple-700 to-purple-500'
                }`}
                style={{ width: `${thrusterFuelPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Small hint under dash */}
        <div className="mt-1 text-[11px] font-mono text-zinc-500 flex items-center gap-3">
          <span>
            {gameMode === 'chase' && 'HOLD [SPACE] TO LEAP OVER POLICE / TRAFFIC (MAX 2.6M)'}
            {gameMode === 'freedrive' && 'HOLD [SPACE] FOR PLAID WARP NITRO HYPER-BOOST'}
            {gameMode === 'drag' && 'HOLD [SPACE] FOR ROCKET LAUNCH CONTROL SURGE'}
          </span>
          {nearMissCount > 0 && (
            <span className="text-cyan-400 font-bold">NEAR MISSES: {nearMissCount}</span>
          )}
        </div>
      </div>

      {/* 4. Mobile / Touch Controls Overlay (visible on smaller screens or touch devices) */}
      <div className="w-full flex items-end justify-between pointer-events-auto md:hidden pb-1">
        {/* Left & Right Steering */}
        <div className="flex items-center gap-2">
          <button
            onTouchStart={() => onInputStart('left')}
            onTouchEnd={() => onInputEnd('left')}
            onMouseDown={() => onInputStart('left')}
            onMouseUp={() => onInputEnd('left')}
            className="w-16 h-16 rounded-2xl bg-zinc-900/90 border border-zinc-700 active:bg-zinc-800 text-white flex items-center justify-center text-xl font-bold cursor-pointer"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <button
            onTouchStart={() => onInputStart('right')}
            onTouchEnd={() => onInputEnd('right')}
            onMouseDown={() => onInputStart('right')}
            onMouseUp={() => onInputEnd('right')}
            className="w-16 h-16 rounded-2xl bg-zinc-900/90 border border-zinc-700 active:bg-zinc-800 text-white flex items-center justify-center text-xl font-bold cursor-pointer"
          >
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>

        {/* Thruster Jump / Boost Button */}
        <button
          onTouchStart={() => onInputStart('thruster')}
          onTouchEnd={() => onInputEnd('thruster')}
          onMouseDown={() => onInputStart('thruster')}
          onMouseUp={() => onInputEnd('thruster')}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 active:scale-95 text-white flex items-center justify-center shadow-lg border border-purple-400 cursor-pointer"
          title="SpaceX Thruster"
        >
          <Flame className="w-7 h-7" />
        </button>

        {/* Gas & Brake Pedals */}
        <div className="flex items-center gap-2">
          <button
            onTouchStart={() => onInputStart('brake')}
            onTouchEnd={() => onInputEnd('brake')}
            onMouseDown={() => onInputStart('brake')}
            onMouseUp={() => onInputEnd('brake')}
            className="w-14 h-16 rounded-2xl bg-red-950/80 border border-red-800 active:bg-red-900 text-red-200 flex items-center justify-center font-bold text-xs uppercase cursor-pointer"
          >
            BRAKE
          </button>
          <button
            onTouchStart={() => onInputStart('throttle')}
            onTouchEnd={() => onInputEnd('throttle')}
            onMouseDown={() => onInputStart('throttle')}
            onMouseUp={() => onInputEnd('throttle')}
            className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-700 active:bg-cyan-900 text-cyan-200 flex items-center justify-center font-black text-sm uppercase cursor-pointer"
          >
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};
