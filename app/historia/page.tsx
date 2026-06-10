"use client";

// ─────────────────────────────────────────────────────────────────────────────
// NOTA: Este é um Client Component porque usa o parallax no hero.
// Se precisar de SSR, extraia apenas a seção hero para um componente separado
// com "use client" e mantenha o resto da page como Server Component.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import Reveal from '@/components/Story/Reveal';
import CinematicImage from '@/components/Story/CinematicImage';

export default function HistoriaPage() {
  const heroContentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // ── PARALLAX DO HERO ───────────────────────────────────────────────────────
  // O conteúdo da hero flutua para cima enquanto você rola, exatamente como
  // o GTA VI faz com o título. Cria a sensação de "mergulhar" na história.
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!heroContentRef.current) return;
        const scrollY = window.scrollY;

        // Move o conteúdo para cima a 30% da velocidade do scroll
        heroContentRef.current.style.transform = `translateY(${scrollY * 0.3}px)`;

        // Fade out suave nos primeiros 700px de scroll
        const opacity = Math.max(0, 1 - scrollY / 700);
        heroContentRef.current.style.opacity = String(opacity);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <main className="relative bg-[#050505] min-h-screen text-stone-200 selection:bg-rose-900 selection:text-white pb-40">

      {/* ── FILM GRAIN ──────────────────────────────────────────────────────── */}
      {/* O segredo visual do Rockstar: textura de película sobre tudo */}
      <div className="fixed inset-0 opacity-[0.025] pointer-events-none z-50 mix-blend-overlay">
        <svg className="w-full h-full">
          <filter id="noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      {/* Position sticky para o conteúdo ficar no centro enquanto o parallax
          desliza. overflow: hidden impede o conteúdo de vazar depois de rolar. */}
      <section className="relative h-[100dvh] flex flex-col items-center justify-center p-8 text-center border-b border-stone-900 overflow-hidden">
        
        {/* Este div é o que se move com o parallax do hero */}
        <div ref={heroContentRef} style={{ willChange: 'transform, opacity' }}>
          <Reveal direction="down" delay={200}>
            <p className="text-rose-800 tracking-[0.4em] uppercase text-sm mb-6 font-semibold">
              Uma jornada de amor
            </p>
          </Reveal>

          <Reveal direction="up" delay={500}>
            <h1
              className="text-6xl md:text-8xl lg:text-[10rem] text-stone-100 font-serif leading-none tracking-tight mb-8"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Nossa História
            </h1>
          </Reveal>

          <Reveal direction="up" delay={900}>
            <div className="w-[1px] h-24 bg-gradient-to-b from-rose-900 to-transparent mx-auto" />
          </Reveal>
        </div>

        {/* Scroll indicator — fica fora do parallax para não sumir cedo demais */}
        <Reveal delay={2000} className="absolute bottom-12 animate-pulse">
          <span className="text-xs text-stone-500 tracking-[0.3em] uppercase">
            Deslize para ler
          </span>
        </Reveal>
      </section>

      {/* ── CAPÍTULO 1: O INÍCIO ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-6 md:px-16 pt-32 md:pt-48">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24 items-center">

          <div className="md:col-span-5 order-2 md:order-1">
            <Reveal direction="left">
              <h2
                className="text-4xl md:text-6xl text-rose-800 font-serif mb-8"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Onde tudo começou
              </h2>
            </Reveal>
            <Reveal direction="up" delay={200}>
              <p
                className="text-lg md:text-xl text-stone-400 font-serif leading-relaxed mb-6"
                style={{ fontFamily: 'var(--font-lora)' }}
              >
                Quando os nossos caminhos se cruzaram pela primeira vez, o mundo pareceu parar por
                um segundo. Foi o início de um capítulo que mudaria tudo.
              </p>
              <p
                className="text-lg md:text-xl text-stone-400 font-serif leading-relaxed"
                style={{ fontFamily: 'var(--font-lora)' }}
              >
                Esta página foi desenhada para guardar e proteger esses fragmentos de memória,
                como uma galeria de arte privada feita apenas para nós.
              </p>
            </Reveal>
          </div>

          <div className="md:col-span-7 order-1 md:order-2">
            {/* parallaxStrength: 0.6 = movimento moderado, bom para imagens grandes */}
            <CinematicImage
              title="O Nosso Primeiro Encontro"
              subtitle="Data do encontro aqui"
              aspectRatio="aspect-[4/5] md:aspect-[3/4]"
              parallaxStrength={0.6}
              // src="/images/primeiro-encontro.jpg"
            />
          </div>

        </div>
      </section>

      {/* ── CAPÍTULO 2: CITAÇÃO + IMAGEM PANORÂMICA ──────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-6 md:px-16 pt-32 md:pt-48">
        <Reveal direction="up" className="text-center max-w-4xl mx-auto mb-20">
          <p
            className="text-3xl md:text-5xl text-stone-300 font-serif leading-snug"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            &quot;Os melhores momentos são aqueles que não planeamos, mas que passam a definir quem somos.&quot;
          </p>
        </Reveal>

        <Reveal delay={300}>
          {/* parallaxStrength: 0.4 = sutil para widescreen (o movimento seria muito
              visível em aspect-ratios horizontais com strength mais alto) */}
          <CinematicImage
            title="Momentos inesquecíveis"
            subtitle="Viagem ou momento marcante"
            aspectRatio="aspect-video md:aspect-[21/9]"
            parallaxStrength={0.4}
            // src="/images/panoramica.jpg"
          />
        </Reveal>
      </section>

      {/* ── CAPÍTULO 3: AS PEQUENAS COISAS ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-6 md:px-16 pt-32 md:pt-48">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24 items-center">

          <div className="md:col-span-6">
            <CinematicImage
              title="Nosso dia a dia"
              aspectRatio="aspect-square"
              parallaxStrength={0.5}
              // src="/images/dia-a-dia.jpg"
            />
          </div>

          <div className="md:col-span-6">
            <Reveal direction="right">
              <h2
                className="text-4xl md:text-6xl text-rose-800 font-serif mb-8"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                As pequenas coisas
              </h2>
            </Reveal>
            <Reveal direction="up" delay={200}>
              <p
                className="text-lg md:text-xl text-stone-400 font-serif leading-relaxed"
                style={{ fontFamily: 'var(--font-lora)' }}
              >
                São nos detalhes simples que o nosso amor se torna gigante. As conversas, os sorrisos
                fáceis, a parceria incondicional. Aqui ficará o espaço para declarar como a rotina
                ao lado dela é o seu momento favorito.
              </p>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ── ENCERRAMENTO ─────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pt-48 pb-20 text-center flex flex-col items-center">
        <Reveal direction="up">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-10 h-10 text-rose-900 mb-8 mx-auto"
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </Reveal>

        <Reveal direction="up" delay={300}>
          <h2
            className="text-4xl md:text-6xl text-stone-100 font-serif leading-tight mb-8"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Este é apenas o nosso prefácio. O melhor da história ainda está por vir.
          </h2>
        </Reveal>

        <Reveal direction="up" delay={600}>
          <p
            className="text-2xl text-stone-500 font-serif italic"
            style={{ fontFamily: 'var(--font-lora)' }}
          >
            Com todo o meu amor, para ti.
          </p>
        </Reveal>
      </section>

    </main>
  );
}