// PhotoUpload — dashed border box with camera icon, tap to capture/upload
import { useRef } from 'react'
import type React from 'react'
import { Camera, X } from 'lucide-react'

interface PhotoUploadProps {
  value?: string | null   // preview URL (blob or remote)
  onChange: (file: File) => void
  onRemove?: () => void
  label?: string
  id?: string
}

export function PhotoUpload({ value, onChange, onRemove, label, id }: PhotoUploadProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const { compressImage } = await import('@/lib/image')
        const compressed = await compressImage(file)
        onChange(compressed)
      } catch (err) {
        console.error('Image compression failed', err)
        onChange(file) // fallback to original
      }
    }
    // reset so re-selecting the same file triggers onChange
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-semibold text-text">{label}</span>}

      {value ? (
        /* Preview */
        <div className="relative w-full aspect-[4/3] rounded-card overflow-hidden border border-border">
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Remove photo"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        /* Upload trigger */
        <button
          type="button"
          id={id}
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-[4/3] rounded-card border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-text-muted hover:border-primary hover:text-primary transition-colors bg-bg"
        >
          <Camera size={28} />
          <span className="text-sm font-medium">Tap to add photo</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
