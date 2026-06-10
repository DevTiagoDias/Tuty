"use client";

import React, { useEffect, useRef, useState } from 'react';

interface CinematicImageProps {
  title: string;
  subtitle?: string;
  aspectRatio?: string; // ex: 'aspect-[4/5]' ou 'aspect-video'
}

export default function CinematicImage({ title, subtitle, aspectRatio = 'aspect-[4/5]' }: CinematicImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref}
      className={`relative w-full ${aspectRatio} overflow-hidden rounded-sm shadow-2xl group border border-stone-800`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'all 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      {/* Aqui entrará a tag <Image /> do Next.js depois. Por enquanto é o fundo preto. */}
      <div 
        className="absolute inset-0 bg-stone-900 w-full h-full"
        style={{
          transform: isVisible ? 'scale(1)' : 'scale(1.15)', // O segredo do efeito Parallax/Zoom
          transition: 'transform 3s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      ></div>

      {/* Overlay e Textos da Imagem */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
        <h3 className="text-rose-100 font-serif text-2xl" style={{ fontFamily: 'var(--font-playfair)' }}>{title}</h3>
        {subtitle && <p className="text-stone-400 text-sm tracking-widest uppercase mt-2">{subtitle}</p>}
      </div>
    </div>
  );
}