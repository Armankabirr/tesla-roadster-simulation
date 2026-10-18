import { useEffect, useRef, useState } from 'react';
import { GameEngine, GameMode, TelemetryData, CameraView } from './game/GameEngine.ts';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameHUD } from './components/GameHUD.tsx';
import { CustomizerDock } from './components/CustomizerDock.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { sound } from './audio/soundEngine.ts';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [selectedMode, setSelectedMode] = useState<GameMode>('chase');
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [currentColorId, setCurrentColorId] = useState<string>('white');
  const [currentCameraView, setCurrentCameraView] = useState<CameraView>('chase');
  const [isMuted, setIsMuted] = useState(false);
  const [gameOverInfo, setGameOverInfo] = useState<{
    reason: string;
    score: number;
    distance: number;
    topSpeed: number;
  } | null>(null);

  // Initialize Three.js Game Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current);
    engineRef.current = engine;

    engine.onTelemetryUpdate = (data) => {
      setTelemetry(data);
      setCurrentCameraView(data.cameraView);
    };

    engine.onGameOver = (reason, score, distance, topSpeed) => {
      setGameOverInfo({ reason, score, distance, topSpeed });
      setGameState('gameover');
    };

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keyboard Navigation for Game States (Enter/Space to start/restart, Esc to pause)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameState === 'playing') {
          handlePause();
        } else if (gameState === 'paused') {
          handleResume();
        }
      } else if (e.code === 'Enter' || e.code === 'Space') {
        if (gameState === 'title') {
          handleStartGame(selectedMode);
        } else if (gameState === 'gameover') {
          handleRestart();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState, selectedMode]);

  const handleStartGame = (mode: GameMode) => {
    if (!engineRef.current) return;
    setSelectedMode(mode);
    setGameState('playing');
    setGameOverInfo(null);
    engineRef.current.start(mode);
  };

  const handlePause = () => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    setGameState('paused');
  };

  const handleResume = () => {
    if (!engineRef.current) return;
    engineRef.current.resume();
    setGameState('playing');
  };

  const handleRestart = () => {
    if (!engineRef.current) return;
    setGameOverInfo(null);
    setGameState('playing');
    engineRef.current.start(selectedMode);
  };

  const handleExitToMenu = () => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    setGameState('title');
  };

  const handleSelectColor = (colorId: string) => {
    setCurrentColorId(colorId);
    if (engineRef.current) {
      engineRef.current.setCarColor(colorId);
    }
  };

  const handleSelectCameraView = (view: CameraView) => {
    setCurrentCameraView(view);
    if (engineRef.current) {
      engineRef.current.setCameraView(view);
    }
  };

  const handleCycleCamera = () => {
    if (engineRef.current) {
      engineRef.current.cycleCamera();
    }
  };

  const handleToggleFSD = () => {
    if (engineRef.current) {
      engineRef.current.toggleFSDVision();
    }
  };

  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  // Mobile virtual controls input handlers
  const handleVirtualInputStart = (action: 'throttle' | 'brake' | 'left' | 'right' | 'thruster') => {
    if (!engineRef.current) return;
    sound.resume();
    engineRef.current.inputs[action] = true;
  };

  const handleVirtualInputEnd = (action: 'throttle' | 'brake' | 'left' | 'right' | 'thruster') => {
    if (!engineRef.current) return;
    engineRef.current.inputs[action] = false;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-['Space_Grotesk',sans-serif]">
      {/* Isolated Three.js WebGL Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* In-Game World-Matched Low-Occlusion HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHUD
          telemetry={telemetry}
          onPause={handlePause}
          onCycleCamera={handleCycleCamera}
          onToggleFSD={handleToggleFSD}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onInputStart={handleVirtualInputStart}
          onInputEnd={handleVirtualInputEnd}
        />
      )}

      {/* Collapsible Unified Bottom Customizer Dock */}
      <CustomizerDock
        currentColorId={currentColorId}
        onSelectColor={handleSelectColor}
        currentCameraView={currentCameraView}
        onSelectCameraView={handleSelectCameraView}
      />

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onExitToMenu={handleExitToMenu}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over / Mission Report Modal */}
      {gameState === 'gameover' && gameOverInfo && (
        <GameOverModal
          reason={gameOverInfo.reason}
          finalScore={gameOverInfo.score}
          distanceMeters={gameOverInfo.distance}
          topSpeedMph={gameOverInfo.topSpeed}
          gameMode={selectedMode}
          onRestart={handleRestart}
          onSelectMode={() => setGameState('title')}
        />
      )}
    </div>
  );
}
