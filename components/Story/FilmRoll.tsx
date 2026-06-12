"use client";

import React from 'react';
import Image from 'next/image';

interface FilmRollProps {
  images: string[];
}

export default function FilmRoll({ images }: FilmRollProps) {
  // Duplicar o array de imagens cria a ilusão de um loop infinito contínuo
  const doubledImages = [...images, ...images];

  return (
    <div className="relative w-full overflow-hidden py-10">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-film-roll {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        .animate-film-roll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Sombras laterais para profundidade */}
      <div className="absolute top-0 bottom-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#050505] to-transparent pointer-events-none z-10"></div>
      
      {/* Contentor do carrossel */}
      <div className="animate-film-roll gap-8 px-4">
        {doubledImages.map((src, index) => (
          <div 
            key={index}
            className="relative w-64 h-80 md:w-80 md:h-[400px] flex-shrink-0 bg-[#fdfbf7] p-3 pb-12 shadow-2xl transform transition-all duration-500 hover:scale-105 hover:z-20 -rotate-1 hover:rotate-0"
          >
            <div className="relative w-full h-full overflow-hidden bg-stone-900">
              <Image 
                src={src}
                alt={`Fotografia do momento ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-amber-900/10 mix-blend-multiply pointer-events-none"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-0 bottom-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none z-10"></div>
    </div>
  );
}