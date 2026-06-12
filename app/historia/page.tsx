"use client";

// ─────────────────────────────────────────────────────────────────────────────
// NOTA: Este é um Client Component porque usa o parallax no hero.
// Se precisar de SSR, extraia apenas a seção hero para um componente separado
// com "use client" e mantenha o resto da page como Server Component.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import Reveal from '@/components/Story/Reveal';
import CinematicImage from '@/components/Story/CinematicImage';
import FilmRoll from '@/components/Story/FilmRoll';

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
              Feliz Dia dos Namorados Minha Princesa
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
            Desce ai meu bem kkk
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
                Eu me lembro muito bem da primeira vez que nos vimos foi tão bom que eu lembro de cada detalhe
                uma das coisas principais que me ocorreram enquanto eu estava a caminha era estar em ligação com 
                o Gabriel(eu ta va muito nervoso pra te ver kakak) eu lembro de estar soando no carro e quando desci
                na frente do shopping e te vi pela primeira vez foi como um estalo de dedos, "Uauuu essa é a garota mais linda que eu ja vi"
                foi o que eu pensei na hora e todo travado eu me fui até vc pra te impressionar e parecer super confiante kakaka
                mas eu quando eu te abracei eu me senti todo o nervosismo que tinha de te ver sumindo e apenas ficando 
                a vontade de fazer vc se apaixonar por mim e dai pra frente foi so cada coisa esquisita akakka um dos melhores dias da minha vida
              </p>
              <p
                className="text-lg md:text-xl text-stone-400 font-serif leading-relaxed"
                style={{ fontFamily: 'var(--font-lora)' }}
              >
                E bom pode parecer estranho mas aqui vai ser nossa propria galeria assim como teu lugarzinho na internet tbm kkk.
              </p>
            </Reveal>
          </div>

          <div className="md:col-span-7 order-1 md:order-2">
          {/* parallaxStrength: 0.6 = movimento moderado, bom para imagens grandes */}
          <CinematicImage
            title="O Nosso Primeiro Encontro"
            subtitle="05/07/2025"
            aspectRatio="aspect-[4/5] md:aspect-[3/4]"
            parallaxStrength={0.6}
            src="/images/foto1.jpg"
          />
          </div>

        </div>
      </section>

      {/* ── CAPÍTULO 2: CITAÇÃO + ROLO DE FILME ──────────────────────────── */}
      <section className="max-w-[100vw] w-full pt-32 md:pt-48 overflow-hidden">
        <Reveal direction="up" className="text-center max-w-4xl mx-auto mb-20 px-6">
          <p
            className="text-3xl md:text-5xl text-stone-300 font-serif leading-snug"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            &quot;Os nossos melhores momentos.&quot;
          </p>
        </Reveal>

        <Reveal delay={300}>
          <FilmRoll 
            images={[
              "/images/foto2.jpg",
              "/images/foto3.jpg",
              "/images/foto4.jpg",
              "/images/foto5.jpg",
              "/images/foto8.jpg",
              "/images/foto9.jpg",
              "/images/foto10.jpg"
            ]} 
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
              src="/images/foto11.jpg" 
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
                É cada pequeno detalhe que sempre me faz te amar cada vez mais por isso essa aba se chama pequenas coisas,
                são os momentos que tu até pode achar que passam despercebidos mas eu sempre notokkk(TDAH),
                quando você fica sem graça e se encolhe sem mesmo ter onde se esconder eu acho mt fofo e amo muito isso, quando você você ri genuinamente
                que não é uma risada fina nem grossa mas sim uma risada infantil de quem ta rindo com cada pedacinho eu amo isso,
                quando você começa a fazer teus dramas e eu tenho que me de desenrolar das formas mais esquisitas para te fazer desistir eu adoro isso e amo,
                quando você se emburra e enche as bochecas sem querer eu amo isso, 
                quando você acha algo muito empolgannte e você começa a fazer gestos com suas mãos pra interpretar tua animação eu amo isso,
                quando você finge estar muito corajosa em filmes de terror mas na verdade você esta morrendo de medo eu amo isso ,
                eu amo cada pequeno detalhe de ti , até os que eu não conto, eu amo tudo em você obrigado por me amar meu bem.
              </p>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ── CAPÍTULO 4: PÁGINAS EM BRANCO ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-6 md:px-16 pt-32 pb-16">
        <Reveal direction="up" className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl text-rose-800 font-serif mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
            O que ainda está por vir
          </h2>
          <p className="text-stone-400 font-serif" style={{ fontFamily: 'var(--font-lora)' }}>
            Espaços reservados para os próximos capítulos da nossa aventura.
          </p>
        </Reveal>

        {/* Contentor com position: relative para segurar o botão no centro */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          
          {/* Imagem 1 (Esquerda) */}
          <Reveal direction="left">
            <CinematicImage
              title="Nova Memória"
              aspectRatio="aspect-square"
              parallaxStrength={0.4}
              src="/images/foto7.jpg" 
            />
          </Reveal>

          {/* Botão Central (Flutuante no meio das duas imagens) */}
          <Reveal delay={600} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className="bg-rose-950/95 backdrop-blur-xl border border-rose-800 text-stone-100 text-xs md:text-sm font-semibold tracking-widest uppercase px-6 py-3 md:px-8 md:py-4 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.9)] whitespace-nowrap">
              Em breve
            </div>
          </Reveal>

          {/* Imagem 2 (Direita) */}
          <Reveal direction="right" delay={200}>
            <CinematicImage
              title="Nova Memória"
              aspectRatio="aspect-square"
              parallaxStrength={0.4}
              src="/images/foto6.jpg" 
            />
          </Reveal>

        </div>
      </section>

      {/* ── ENCERRAMENTO ─────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pt-32 pb-32 text-center flex flex-col items-center">
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
            Este é apenas o nosso início. Temos mais momentos incríveis por vir.
          </h2>
        </Reveal>

        <Reveal direction="up" delay={600}>
          <p
            className="text-2xl text-stone-500 font-serif italic"
            style={{ fontFamily: 'var(--font-lora)' }}
          >
            Com toda minha alma por ti
          </p>
          <p
            className="text-2xl text-stone-500 font-serif italic"
            style={{ fontFamily: 'var(--font-lora)' }}
          >
            EU TE AMO
          </p>
          <p
            className="text-2xl text-stone-500 font-serif italic"
            style={{ fontFamily: 'var(--font-lora)' }}
          >
            FELIZ PRIMEIRO DIA DOS NAMORADOS
          </p>
        </Reveal>
      </section>

    </main>
  );
}