import LetterCard from "@/components/Letter/LetterCard";
import UploadButton from '@/components/Upload/UploadButton'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 overflow-hidden relative">
      <LetterCard />
      <div className="flex gap-4 mt-8">
        {/* Aqui está o seu botão chamando o componente */}
        <UploadButton /> 
        
        {/* E aqui um link para ir para a página da galeria ver as fotos */}
        <Link href="/galeria" className="bg-gray-200 px-4 py-2 rounded text-black hover:bg-gray-300">
          Ver Galeria
        </Link>
      </div>
    </main>
  );
}