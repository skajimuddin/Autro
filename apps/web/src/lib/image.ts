// Client-side image compression
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1920

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
                type: 'image/webp',
                lastModified: Date.now(),
              })
              resolve(newFile)
            } else {
              reject(new Error('Canvas to Blob failed'))
            }
          },
          'image/webp',
          0.8,
        )
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}
