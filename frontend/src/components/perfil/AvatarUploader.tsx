// src/components/perfil/AvatarUploader.tsx
'use client'

import { useState, useRef } from 'react'
import { Camera, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { LoadingSpinner } from '../LoadingSpinner'

interface AvatarUploaderProps {
    currentAvatarUrl: string | null
    onUploadSuccess: (url: string) => void
}

export function AvatarUploader({ currentAvatarUrl, onUploadSuccess }: AvatarUploaderProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) {
            return
        }

        const file = e.target.files[0]

        // validate size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showToast('La imagen es muy pesada. Máximo 5MB.', 'error')
            return
        }

        // validate type
        if (!file.type.startsWith('image/')) {
            showToast('Por favor, seleccioná una imagen válida.', 'error')
            return
        }

        setUploading(true)

        try {
            // 1. Generate unique file name: user_id/timestamp.ext
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            // 2. Upload to Supabase Storage 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            // 3. Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const avatarUrl = publicUrlData.publicUrl

            // 4. Update Profile record in DB
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: avatarUrl })
                .eq('id', user.id)

            if (updateError) throw updateError

            // 5. Success callback
            onUploadSuccess(avatarUrl)
            showToast('Foto de perfil actualizada', 'success')

        } catch (error: any) {
            console.error('Error uploading avatar:', error.message)
            showToast('Hubo un error al subir la imagen.', 'error')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <div className="relative group cursor-pointer w-24 h-24 mx-auto rounded-full overflow-hidden shadow-lg border-4 border-[var(--card-bg)] bg-gradient-to-br from-[#10b981] to-[#3b82f6]">
            {/* Current Avatar or Fallback */}
            {currentAvatarUrl ? (
                <img
                    src={currentAvatarUrl}
                    alt="Avatar"
                    className={`w-full h-full object-cover transition-opacity duration-300 ${uploading ? 'opacity-50 blur-sm' : 'group-hover:opacity-75'}`}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br from-[#10b981] to-[#3b82f6]">
                    {uploading ? <LoadingSpinner /> : '👤'}
                </div>
            )}

            {/* Upload Overlay */}
            <div
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                {uploading ? (
                    <RefreshCw className="text-white animate-spin" size={24} />
                ) : (
                    <Camera className="text-white" size={28} />
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                disabled={uploading}
            />
        </div>
    )
}
