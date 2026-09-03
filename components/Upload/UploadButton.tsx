'use client'
import { useState } from 'react'
import { supabase } from '@/utils/supabase'

export default function UploadButton() {
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`

      // 1. Faz o upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('galeria')
        .upload(fileName, file)
      
      if (uploadError) throw uploadError

      // 2. Pega a URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('galeria')
        .getPublicUrl(fileName)

      // 3. Salva a URL no Banco de Dados
      const { error: dbError } = await supabase.from('fotos').insert([{ url: publicUrl }])
      
      if (dbError) throw dbError

      alert('Foto salva com sucesso na nossa galeria! ❤️')
    } catch (error) {
      console.error(error)
      alert('Ops! Tivemos um erro ao fazer upload. Verifique o console.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center justify-center">
      <label 
        className={`
          flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white shadow-lg
          transition-all duration-300 ease-in-out cursor-pointer
          ${uploading 
            ? 'bg-gray-400 cursor-not-allowed scale-95' 
            : 'bg-rose-500 hover:bg-rose-600 hover:scale-105 active:scale-95'
          }
        `}
      >
        {uploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Enviando nossa foto...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            Adicionar nova foto
          </>
        )}
        <input 
          type="file" 
          accept="image/*" 
          onChange={uploadFile} 
          disabled={uploading}
          className="hidden" 
        />
      </label>
    </div>
  )
}