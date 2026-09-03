import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export const revalidate = 0 

export default async function Galeria() {
  const { data: fotos } = await supabase
    .from('fotos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    // "pt-24" garante que o título fique abaixo da carta caso haja navegação superior
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-8 bg-[#f9f9f9]">
      
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col items-center justify-center mb-12 relative">
          
          <Link 
            href="/" 
            className="absolute left-0 top-0 flex items-center gap-2 text-rose-500 hover:text-rose-700 transition-colors font-medium bg-white px-4 py-2 rounded-full shadow-sm hover:shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Voltar
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-rose-500 mt-16 md:mt-0 font-serif tracking-wide">
            Nossa Galeria ❤️
          </h1>
          <p className="text-gray-500 mt-3 text-center text-lg italic font-serif">
            As melhores fotos de nós dois
          </p>
        </div>
        
        {/* Grid de Fotos - Usando "columns" para estilo Pinterest/Masonry */}
        {fotos && fotos.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {fotos.map((foto) => (
              <div 
                key={foto.id} 
                className="break-inside-avoid rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-white p-2"
              >
                <img 
                  src={foto.url} 
                  alt="Nossa foto" 
                  // Usando w-full h-auto e removendo object-cover para não cortar a imagem
                  className="w-full h-auto rounded-lg"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-24">
            <p className="text-xl">Nenhuma foto salva ainda...</p>
            <p className="text-sm mt-2">Vá na página inicial e faça o primeiro upload! 📸</p>
          </div>
        )}
      </div>
    </div>
  )
}