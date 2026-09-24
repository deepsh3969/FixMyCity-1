const COMPRESS_THRESHOLD = 300 * 1024
const MAX_DIMENSION = 1920
const QUALITY = 0.82

// Downscale + re-encode large photos so they fit serverless request limits
// (Vercel rejects bodies over 4.5MB). Returns the original file when
// compression is unnecessary or not possible.
export async function compressImage(file) {
  if (!file || typeof file === 'string') return file
  if (!/^image\/(jpeg|png|webp)$/.test(file.type || '')) return file
  if (file.size <= COMPRESS_THRESHOLD) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
    if (!blob || blob.size >= file.size) return file

    const baseName = (file.name || 'image').replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now()
    })
  } catch {
    return file
  }
}
