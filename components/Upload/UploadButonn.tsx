// components/UploadButton.tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/utils/supabase'

export default function UploadButton() {
  const [uploading, setUploading] = useState(false)

  const uploadFila = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      await supabase.from('fotos').insert([{ url: publicUrl }])
      
      alert('Foto salva com sucesso!')
    } catch (error) {
      alert('Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded">
        {uploading ? 'Enviando...' : 'Fazer Upload'}
        <input type="file" accept="image/*" onChange={uploadFila} className="hidden" />
      </label>
    </div>
  )
}