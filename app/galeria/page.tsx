// app/galeria/page.tsx
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export const revalidate = 0 // Garante que a página atualize ao receber novas fotos

export default async function Galeria() {
  const { data: fotos } = await supabase
    .from('fotos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Nossa Galeria</h1>
        <Link href="/" className="text-blue-500 underline">Voltar</Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {fotos?.map((foto) => (
          <img 
            key={foto.id} 
            src={foto.url} 
            alt="Foto da galeria" 
            className="w-full h-64 object-cover rounded-lg shadow-md"
          />
        ))}
      </div>
    </div>
  )
}