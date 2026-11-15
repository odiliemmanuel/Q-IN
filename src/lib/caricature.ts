/**
 * Client-side caricature generation.
 *
 * Produces a hand-drawn / sketched look from an ordinary photo so people on a
 * queue can be recognised, without ever uploading the raw photo anywhere.
 * Everything happens on a <canvas>: grayscale edges, an inverted blurred copy
 * blended with `color-dodge` (the classic pencil-sketch recipe) plus a mild
 * contrast lift so faces stay readable at small sizes.
 */

const OUTPUT_SIZE = 320

async function fileToImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not read that image.'))
      img.src = url
    })
  } finally {
    // Revoke a tick later so the image has definitely decoded.
    setTimeout(() => URL.revokeObjectURL(url), 1_000)
  }
}

/** Center-crop to a square so avatars are uniform. */
function squareCrop(img: HTMLImageElement): HTMLCanvasElement {
  const side = Math.min(img.naturalWidth, img.naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = side
  canvas.height = side
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable.')
  ctx.drawImage(
    img,
    (img.naturalWidth - side) / 2,
    (img.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    side,
    side,
  )
  return canvas
}

function sketch(base: HTMLCanvasElement): HTMLCanvasElement {
  const size = OUTPUT_SIZE
  const out = document.createElement('canvas')
  out.width = size
  out.height = size
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable.')

  // 1. Base layer: grayscale original.
  ctx.drawImage(base, 0, 0, size, size)
  const overlay = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < overlay.data.length; i += 4) {
    const gray =
      0.299 * overlay.data[i] + 0.587 * overlay.data[i + 1] + 0.114 * overlay.data[i + 2]
    overlay.data[i] = overlay.data[i + 1] = overlay.data[i + 2] = gray
  }
  ctx.putImageData(overlay, 0, 0)

  // 2. Dodge layer: the base inverted + heavily blurred, drawn with
  //    `color-dodge` so only dark strokes (edges, contours) survive.
  const dodge = document.createElement('canvas')
  dodge.width = size
  dodge.height = size
  const dctx = dodge.getContext('2d')
  if (!dctx) throw new Error('Canvas unavailable.')
  dctx.filter = 'blur(6px)'
  dctx.drawImage(out, 0, 0)
  dctx.filter = 'none'
  dctx.globalCompositeOperation = 'difference'
  dctx.fillStyle = '#ffffff'
  dctx.fillRect(0, 0, size, size) // invert
  dctx.globalCompositeOperation = 'source-over'

  ctx.globalCompositeOperation = 'color-dodge'
  ctx.drawImage(dodge, 0, 0)
  ctx.globalCompositeOperation = 'source-over'

  // 3. Character pass: a slightly brighter soft copy at low opacity gives the
  //    "colored sketch" warmth instead of a flat gray sheet.
  ctx.globalAlpha = 0.22
  ctx.filter = 'saturate(1.5) brightness(1.15) contrast(0.9)'
  ctx.drawImage(base, 0, 0, size, size)
  ctx.filter = 'none'
  ctx.globalAlpha = 1

  // 4. Gentle contrast lift so the sketch pops at avatar size.
  const final = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < final.data.length; i += 4) {
    final.data[i] = Math.min(255, Math.max(0, (final.data[i] - 128) * 1.15 + 130))
    final.data[i + 1] = Math.min(255, Math.max(0, (final.data[i + 1] - 128) * 1.15 + 130))
    final.data[i + 2] = Math.min(255, Math.max(0, (final.data[i + 2] - 128) * 1.15 + 130))
  }
  ctx.putImageData(final, 0, 0)

  return out
}

/** Generate a caricature data URL from an uploaded/captured photo. */
export async function generateCaricature(file: Blob): Promise<string> {
  const img = await fileToImage(file)
  const cropped = squareCrop(img)
  return sketch(cropped).toDataURL('image/png')
}
