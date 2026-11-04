"use client";

import React from "react";
import { InputAction, InputHandler } from "../engine/InputHandler";

interface TouchControlsProps {
  input: InputHandler;
}

interface PadButtonProps {
  action: InputAction;
  label: string;
  input: InputHandler;
  className?: string;
}

function PadButton({ action, label, input, className = "" }: PadButtonProps) {
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    input.setAction(action, true);
  };

  const handlePointerRelease = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    input.setAction(action, false);
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      onLostPointerCapture={() => input.setAction(action, false)}
      onContextMenu={(e) => e.preventDefault()}
      className={`touch-none select-none flex items-center justify-center rounded-2xl 
        bg-neutral-900/80 border border-white/15 text-white font-bold shadow-lg 
        active:scale-95 active:bg-rose-600/90 active:border-rose-400 transition-transform ${className}`}
    >
      {label}
    </button>
  );
}

export default function TouchControls({ input }: TouchControlsProps) {
  return (
    <div
      className="w-full max-w-[800px] flex items-center justify-between px-3 py-4 mt-2 md:hidden touch-none select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* D-Pad Esquerdo (Movimentação) */}
      <div className="flex gap-3">
        <PadButton
          action="left"
          label="◀"
          input={input}
          className="w-16 h-16 text-2xl"
        />
        <PadButton
          action="right"
          label="▶"
          input={input}
          className="w-16 h-16 text-2xl"
        />
      </div>

      {/* Botão Direito (Ação / Pulo) */}
      <div>
        <PadButton
          action="jump"
          label="PULAR"
          input={input}
          className="w-24 h-16 text-sm tracking-wider bg-rose-600/80 border-rose-400/30"
        />
      </div>
    </div>
  );
}