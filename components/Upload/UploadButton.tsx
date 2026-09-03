import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export const revalidate = 0 

export default async function Galeria() {
  const { data: fotos } = await supabase
    .from('fotos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    // O "pt-32" (padding-top) é o que vai descer a página para não sobrepor a carta
    <div className="min-h-screen pt-32 pb-12 px-4 sm:px-8 bg-gradient-to-b from-[#fdfbfb] to-[#ebedee]">
      
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho da Galeria */}
        <div className="flex flex-col items-center justify-center mb-14 relative">
          
          {/* Botão de Voltar estiloso */}
          <Link 
            href="/" 
            className="absolute left-0 top-0 md:top-4 flex items-center gap-2 text-rose-500 hover:text-rose-700 transition-colors font-medium bg-white px-4 py-2 rounded-full shadow-sm hover:shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Voltar
          </Link>

          {/* Título Bonito com Gradiente */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-600 text-center mt-16 md:mt-0 drop-shadow-sm">
            Nossa Galeria ❤️
          </h1>
          <p className="text-gray-500 mt-4 text-center text-lg italic">
            Nossos melhores momentos eternizados aqui.
          </p>
        </div>
        
        {/* Grid de Fotos com efeito Hover */}
        {fotos && fotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {fotos.map((foto) => (
              <div 
                key={foto.id} 
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-4 border-white"
              >
                <img 
                  src={foto.url} 
                  alt="Nossa foto" 
                  className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Efeito de escurecer levemente a foto ao passar o mouse */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-24">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-rose-300 opacity-50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-xl">Nenhuma foto ainda...</p>
            <p className="text-sm mt-2">Vá na página inicial e faça o primeiro upload! 📸</p>
          </div>
        )}
      </div>
    </div>
  )
}