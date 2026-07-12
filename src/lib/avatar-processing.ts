// Client-side avatar preprocessing: reject too-big/wrong-type files, then
// center-crop to a square and encode to WebP. Kept in a tiny standalone file so
// it can be unit-tested and swapped later without touching UI.

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024      // 5 MB — hard cap on the raw input
export const AVATAR_OUTPUT_SIZE = 256                // square side of the encoded WebP
export const WEBP_QUALITY = 0.85                     // sweet spot for photos ~15-25 KB

export type ProcessError =
  | { kind: 'too-big'; sizeBytes: number }
  | { kind: 'wrong-type'; mime: string }
  | { kind: 'decode-failed' }
  | { kind: 'encode-failed' }

export type ProcessResult =
  | { ok: true; blob: Blob; previewUrl: string }
  | { ok: false; error: ProcessError }

// Convert an arbitrary user-picked image file into a 256×256 WebP blob suitable
// for upload. Also returns an object URL to the SAME blob for preview — the
// caller must revokeObjectURL(previewUrl) when it stops rendering.
export async function processAvatar(file: File): Promise<ProcessResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: { kind: 'wrong-type', mime: file.type } }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: { kind: 'too-big', sizeBytes: file.size } }
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { ok: false, error: { kind: 'decode-failed' } }
  }

  try {
    const size = AVATAR_OUTPUT_SIZE
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return { ok: false, error: { kind: 'encode-failed' } }

    // Center-crop the source into the largest square it contains, then draw
    // that square into the whole 256×256 canvas.
    const side = Math.min(bitmap.width, bitmap.height)
    const sx = (bitmap.width - side) / 2
    const sy = (bitmap.height - side) / 2
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size)
    bitmap.close()

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
    )
    if (!blob) return { ok: false, error: { kind: 'encode-failed' } }

    return { ok: true, blob, previewUrl: URL.createObjectURL(blob) }
  } catch {
    bitmap.close()
    return { ok: false, error: { kind: 'encode-failed' } }
  }
}
