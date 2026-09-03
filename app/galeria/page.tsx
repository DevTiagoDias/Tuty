import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export const revalidate = 0 

export default async function Galeria() {
  const { data: fotos } = await supabase
    .from('fotos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    // Fundo preto e texto base branco
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-8 bg-black text-white">
      
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col items-center justify-center mb-12 relative">
          
          {/* Botão de Voltar adaptado para o fundo escuro */}
          <Link 
            href="/" 
            className="absolute left-0 top-0 flex items-center gap-2 text-rose-500 hover:text-rose-400 transition-colors font-medium bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 hover:bg-zinc-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Voltar
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-rose-500 mt-16 md:mt-0 font-serif tracking-wide">
            Nossa Galeria ❤️
          </h1>
          <p className="text-zinc-400 mt-3 text-center text-lg italic font-serif">
            As melhores fotos de nós dois
          </p>
        </div>
        
        {/* Grid de Fotos - Mantendo o estilo Pinterest (tamanhos originais) */}
        {fotos && fotos.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {fotos.map((foto) => (
              <div 
                key={foto.id} 
                // Moldura escura com um leve brilho rosa ao passar o mouse
                className="break-inside-avoid rounded-xl transition-all duration-300 bg-zinc-900 p-2 border border-zinc-800 hover:border-rose-500/50 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]"
              >
                <img 
                  src={foto.url} 
                  alt="Nossa foto" 
                  className="w-full h-auto rounded-lg"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-zinc-500 mt-24">
            <p className="text-xl">Nenhuma foto salva ainda...</p>
            <p className="text-sm mt-2">Vá na página inicial e faça o primeiro upload! 📸</p>
          </div>
        )}
      </div>
    </div>
  )
}