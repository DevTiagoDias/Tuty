import React from 'react';
import Link from 'next/link';

// Componente interno que desenha a tulipa e suas folhas usando apenas vetores matemáticos (SVG)
const SvgTulip = ({ rotation }: { rotation: number }) => (
  <div className="absolute inset-0 flex items-start justify-center pointer-events-none" style={{ transform: `rotate(${rotation}deg)` }}>
    <svg viewBox="0 0 100 200" className="w-20 h-40 md:w-28 md:h-56 -mt-8 md:-mt-12 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
       {/* Caule verde escuro */}
       <path d="M50 100 Q 45 150 50 200" stroke="#1d3816" strokeWidth="3" fill="none" />
       {/* Folhas verdes */}
       <path d="M49 110 Q 20 90 25 170 Q 40 140 49 130" fill="#244a1b" />
       <path d="M51 130 Q 80 110 75 190 Q 60 160 51 150" fill="#2d5c22" />
       
       {/* Cabeça da Tulipa Fechada (composição de pétalas vermelhas em camadas) */}
       <g transform="translate(0, -10)">
          <path d="M30 70 Q 50 10 70 70 Q 50 110 30 70 Z" fill="#7a0815" /> {/* Fundo escuro */}
          <path d="M30 70 Q 40 20 50 30 Q 60 90 45 100 Q 25 90 30 70 Z" fill="#ab1122" /> {/* Esquerda */}
          <path d="M70 70 Q 60 20 50 30 Q 40 90 55 100 Q 75 90 70 70 Z" fill="#d4152b" /> {/* Direita */}
          <path d="M40 75 Q 50 30 60 75 Q 55 110 45 110 Q 35 100 40 75 Z" fill="#f01a35" /> {/* Centro brilhante */}
       </g>
    </svg>
  </div>
);

export default function LetterCard() {
  return (
    <div className="relative flex items-center justify-center w-full min-h-[80vh]">
      {/* O Link engloba toda a arte, tornando-a clicável para ir à página da história */}
      <Link href="/historia" className="relative group cursor-pointer hover:scale-105 transition-transform duration-700 z-10 flex items-center justify-center w-full max-w-3xl aspect-square">

        {/* GUIRLANDA DE TULIPAS GERADA POR CÓDIGO */}
        {/* Criamos um array de 16 posições e rotacionamos cada tulipa para formar um círculo perfeito */}
        <div className="absolute w-[450px] h-[450px] md:w-[650px] md:h-[650px] flex items-center justify-center transition-transform duration-1000 group-hover:rotate-3">
           {Array.from({ length: 16 }).map((_, i) => (
             <SvgTulip key={i} rotation={i * 22.5} />
           ))}
        </div>

        {/* ENVELOPE FECHADO (CSS PURO) */}
        {/* A base do envelope com a textura off-white */}
        <div className="relative w-[300px] h-[200px] md:w-[420px] md:h-[280px] bg-[#d9d2c5] shadow-[0_25px_50px_rgba(0,0,0,0.9)] rounded-sm overflow-hidden z-10 transition-shadow duration-500 group-hover:shadow-[0_25px_60px_rgba(220,20,60,0.3)] border border-[#a39c90]">

          {/* Abas do envelope criadas com cálculos geométricos (clip-path) simulando papel dobrado */}
          <div className="absolute inset-0 bg-[#e8e2d4]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' }}></div> {/* Aba Direita */}
          <div className="absolute inset-0 bg-[#ebe5d9]" style={{ clipPath: 'polygon(0 0, 0 100%, 50% 50%)' }}></div> {/* Aba Esquerda */}
          <div className="absolute inset-0 bg-[#f4efe4]" style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)' }}></div> {/* Aba Inferior */}
          <div className="absolute inset-0 bg-[#fdfbf7] drop-shadow-2xl" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 55%)' }}></div> {/* Aba Superior */}

          {/* Sombras suaves nas dobras do papel */}
          <div className="absolute inset-0 border border-black/5"></div>
          
          {/* FITA DE VELUDO VERMELHA */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 md:w-12 bg-[#5c0005] border-x border-[#3a0002] shadow-[0_0_10px_rgba(0,0,0,0.6)] flex justify-center">
            {/* Linha sutil para dar textura de tecido à fita */}
            <div className="w-[1px] h-full bg-[#80000a] opacity-40"></div> 
          </div>

          {/* SELO DE CERA (WAX SEAL) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 bg-[#610005] rounded-full shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_4px_8px_rgba(255,255,255,0.2),inset_0_-4px_8px_rgba(0,0,0,0.4)] flex items-center justify-center z-20 transition-transform duration-500 group-hover:scale-110">
            {/* Borda interna elevada imitando a cera derretida */}
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-[2px] border-[#8a1c22] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center bg-[#570004]">
               {/* Ícone de coração afundado na cera */}
               <svg fill="#3a0002" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#8a1c22" className="w-6 h-6 md:w-8 md:h-8 shadow-sm">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
               </svg>
            </div>
          </div>

        </div>

        {/* Dica visual para a Tuany saber que pode clicar */}
        <div className="absolute bottom-4 md:-bottom-8 left-1/2 -translate-x-1/2 text-rose-400/80 font-serif text-xs tracking-[0.3em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-700">
           Clique para abrir
        </div>

      </Link>
    </div>
  );
}