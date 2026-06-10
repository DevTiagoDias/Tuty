"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

interface CinematicImageProps {
  src?: string;           // Path da imagem (opcional por enquanto)
  alt?: string;
  title: string;
  subtitle?: string;
  aspectRatio?: string;
  parallaxStrength?: number; // 0.0 a 1.0 — quão rápido o bg se move. Padrão: 0.5
}

// O wrapper do bg é 40% maior que o container (20% em cima + 20% em baixo)
// para ter espaço de viajar sem mostrar borda.
const BG_OVERFLOW = 20; // %

export default function CinematicImage({
  src,
  alt = '',
  title,
  subtitle,
  aspectRatio = 'aspect-[4/5]',
  parallaxStrength = 0.5,
}: CinematicImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgWrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [hasEntered, setHasEntered] = useState(false);

  // ── EFEITO 1: Entrada ─────────────────────────────────────────────────────
  // Dispara UMA vez quando o elemento entra na tela.
  // Anima: opacidade 0→1 (no container) e escala 1.12→1 (no bg).
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ── EFEITO 2: Parallax ────────────────────────────────────────────────────
  // Aplica translateY DIRETO no DOM (sem re-render), a cada frame de scroll.
  // O bg se move mais devagar que o container → cria a ilusão de profundidade.
  const updateParallax = useCallback(() => {
    if (!containerRef.current || !bgWrapperRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;

    // progress: 0 = elemento na base da tela | 1 = elemento no topo
    const raw = (vh - rect.top) / (vh + rect.height);
    const progress = Math.max(0, Math.min(1, raw));

    // O bg percorre ±(BG_OVERFLOW% da altura) * força do parallax
    // Ex: container 600px, força 0.5 → bg viaja ±60px (120px total)
    const maxOffset = (rect.height * BG_OVERFLOW * parallaxStrength) / 100;
    const offset = (0.5 - progress) * maxOffset * 2;

    // transform direto no elemento — zero garbage, zero re-render
    bgWrapperRef.current.style.transform = `translateY(${offset}px)`;
  }, [parallaxStrength]);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateParallax);
    };

    updateParallax(); // cálculo inicial (p/ elementos já visíveis na carga)
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateParallax);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateParallax);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateParallax]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${aspectRatio} overflow-hidden rounded-sm shadow-2xl border border-stone-800`}
      style={{
        // Fade-in do container inteiro na entrada
        opacity: hasEntered ? 1 : 0,
        transition: 'opacity 1.5s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/*
       * PARALLAX WRAPPER
       * Maior que o container para ter espaço de deslizar.
       * Recebe o translateY do scroll — SEM transition para ser instantâneo.
       */}
      <div
        ref={bgWrapperRef}
        className="absolute inset-x-0"
        style={{
          top: `-${BG_OVERFLOW}%`,
          height: `${100 + BG_OVERFLOW * 2}%`,
          willChange: 'transform',
        }}
      >
        {/*
         * ZOOM DE ENTRADA
         * Começa em scale(1.12) e vai para scale(1) com transição de 3s.
         * Isso é o efeito "câmera recuando" do Rockstar.
         * Depois que hasEntered=true, o scale não muda mais — o parallax
         * fica só no wrapper pai (translateY), que não tem transition.
         */}
        <div
          className="w-full h-full bg-stone-900"
          style={{
            transform: hasEntered ? 'scale(1)' : 'scale(1.12)',
            transition: 'transform 3s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {/* ── Imagem real ────────────────────────────────────────────────
           * Descomentar quando tiver os arquivos de imagem.
           * Colocar as fotos em /public/images/ e passar o src como prop.
           * Ex: <CinematicImage src="/images/primeiro-encontro.jpg" ... />
           */}
          {src && (
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 60vw"
              priority={false}
            />
          )}
        </div>
      </div>

      {/* Overlay gradient com os textos */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-8 z-10">
        <h3
          className="text-rose-100 font-serif text-2xl"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-stone-400 text-sm tracking-widest uppercase mt-2">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}