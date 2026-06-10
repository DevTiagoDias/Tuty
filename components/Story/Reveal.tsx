"use client";

import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;      // ms
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

// Mapa de transforms iniciais por direção
const HIDDEN_TRANSFORMS: Record<NonNullable<RevealProps['direction']>, string> = {
  up:    'translateY(60px)',
  down:  'translateY(-60px)',
  left:  'translateX(-60px)',
  right: 'translateX(60px)',
  none:  'translate(0, 0)',
};

export default function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Acessibilidade: se o usuário pediu para reduzir movimento, mostra tudo direto
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // Anima só uma vez, como cena de filme
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px', // Dispara ligeiramente antes de entrar
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0, 0)' : HIDDEN_TRANSFORMS[direction],
        transitionProperty: 'opacity, transform',
        transitionDuration: '1.5s',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}