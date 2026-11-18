"use client";

import React, { useEffect, useRef, useState } from "react";
import { LEVELS_DATA } from "./levels/levels.data";
import { InputHandler } from "./engine/InputHandler";
import { Player } from "./entities/Player";
import { Renderer } from "./engine/Renderer";
import { Physics } from "./engine/Physics";
import { Camera2D } from "./engine/Camera2D";
import { LevelConfig } from "./types/game.types";
import TouchControls from "./ui/TouchControls";

export default function PlatformerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<InputHandler>(new InputHandler());
  const isPausedRef = useRef<boolean>(false);

  const [levelIndex, setLevelIndex] = useState(0);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);

  const currentLevel = LEVELS_DATA[levelIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const input = inputRef.current;
    input.attach();
    isPausedRef.current = false;

    const level: LevelConfig = structuredClone(LEVELS_DATA[levelIndex]);
    const player = new Player(level.spawn);
    const camera = new Camera2D(canvas.width, canvas.height);

    let lastTime = performance.now();
    let animationId: number;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      if (!isPausedRef.current) {
        player.update(dt, input, level.platforms, level.worldWidth);
        camera.follow(player, level.worldWidth, dt);

        if (player.y > canvas.height + 90) {
          player.reset(level.spawn);
          camera.reset();
        }

        for (const item of level.collectibles) {
          if (!item.collected) {
            const dist = Math.hypot(
              player.x + player.w / 2 - item.x,
              player.y + player.h / 2 - item.y
            );
            if (dist < item.radius + 16) {
              item.collected = true;
            }
          }
        }

        const allCollected = level.collectibles.every((c) => c.collected);
        if (allCollected && Physics.checkAABB(player, level.goal)) {
          isPausedRef.current = true;
          setIsLevelComplete(true);
        }

        Renderer.draw(ctx, canvas, level, player, allCollected, camera);
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      input.detach();
    };
  }, [levelIndex]);

  const handleNextLevel = () => {
    setIsLevelComplete(false);
    if (levelIndex < LEVELS_DATA.length - 1) {
      setLevelIndex((prev) => prev + 1);
    } else {
      setIsGameFinished(true);
    }
  };

  const handleRestartGame = () => {
    setIsGameFinished(false);
    setIsLevelComplete(false);
    setLevelIndex(0);
  };

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col items-center touch-none select-none">
      <div className="w-full flex items-center justify-between mb-3 px-1 font-mono">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white">
            {currentLevel.title}
          </h2>
          <p className="text-xs md:text-sm text-neutral-400">
            {currentLevel.subtitle}
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-rose-400">
          Fase {levelIndex + 1} / {LEVELS_DATA.length}
        </span>
      </div>

      <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-neutral-800 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          style={{ imageRendering: "pixelated" }}
          className="w-full h-full block touch-none"
        />

        {isLevelComplete && !isGameFinished && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-6 text-center z-10">
            <img
              src={currentLevel.rewardImage}
              alt={currentLevel.title}
              className="w-28 h-28 md:w-36 md:h-36 object-cover rounded-xl border-2 border-rose-500/60 shadow-lg mb-3"
            />
            <h3 className="text-lg md:text-xl font-bold text-rose-400 mb-1">
              Memória Desbloqueada! ❤️
            </h3>
            <p className="text-xs md:text-sm text-neutral-200 max-w-md mb-4">
              {currentLevel.memoryText}
            </p>
            <button
              type="button"
              onClick={handleNextLevel}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-sm font-semibold rounded-full transition"
            >
              {levelIndex < LEVELS_DATA.length - 1
                ? "Próxima Fase →"
                : "Finalizar Jornada ✨"}
            </button>
          </div>
        )}

        {isGameFinished && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <h3 className="text-xl md:text-2xl font-bold text-rose-400 mb-2">
              Nossa História Continua... ❤️
            </h3>
            <p className="text-xs md:text-sm text-neutral-300 max-w-md mb-5">
              Você completou todas as 4 fases no nosso jardim de rosas!
            </p>
            <button
              type="button"
              onClick={handleRestartGame}
              className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white text-sm font-semibold rounded-full border border-white/10 transition"
            >
              Jogar Novamente
            </button>
          </div>
        )}
      </div>

      <TouchControls input={inputRef.current} />
    </div>
  );
}
