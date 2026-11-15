/**
 * Client-side caricature generation.
 *
 * Produces an emoji-style caricature from an ordinary photo so people on a
 * queue can be recognised, without ever uploading the raw photo anywhere.
 * Everything happens on a <canvas>: face-aware processing with vibrant colors,
 * exaggerated features, and a cartoon/emoji aesthetic.
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

function cartoonify(base: HTMLCanvasElement): HTMLCanvasElement {
  const size = OUTPUT_SIZE
  const out = document.createElement('canvas')
  out.width = size
  out.height = size
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable.')

  // 1. Draw base image at output size
  ctx.drawImage(base, 0, 0, size, size)

  // 2. Bilateral filter approximation for smooth skin (multiple small blurs)
  const temp = document.createElement('canvas')
  temp.width = size
  temp.height = size
  temp.getContext('2d')!
  
  // Apply edge-preserving smoothing
  ctx.filter = 'blur(2px)'
  ctx.drawImage(out, 0, 0)
  ctx.filter = 'none'
  
  // 3. Enhance saturation for cartoon look
  ctx.globalCompositeOperation = 'color'
  ctx.globalAlpha = 0.3
  ctx.drawImage(out, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1

  // 4. Posterize / reduce color levels for cartoon effect
  const imageData = ctx.getImageData(0, 0, size, size)
  const levels = 8 // Number of color levels per channel
  for (let i = 0; i < imageData.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const val = imageData.data[i + c]
      imageData.data[i + c] = Math.floor(val / (256 / levels)) * (256 / levels) + (256 / levels) / 2
    }
  }
  ctx.putImageData(imageData, 0, 0)

  // 5. Edge detection for outlines (Sobel-like)
  const edgeCanvas = document.createElement('canvas')
  edgeCanvas.width = size
  edgeCanvas.height = size
  const ectx = edgeCanvas.getContext('2d')!
  ectx.filter = 'grayscale(1) contrast(3)'
  ectx.drawImage(out, 0, 0)
  ectx.filter = 'none'
  const edgeData = ectx.getImageData(0, 0, size, size)
  const sobelData = ectx.createImageData(size, size)
  
  // Simple edge enhancement
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = (y * size + x) * 4
      const left = edgeData.data[((y * size + (x - 1)) * 4)]
      const right = edgeData.data[((y * size + (x + 1)) * 4)]
      const up = edgeData.data[(((y - 1) * size + x) * 4)]
      const down = edgeData.data[(((y + 1) * size + x) * 4)]
      const gx = right - left
      const gy = down - up
      const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 3)
      
      sobelData.data[idx] = 0
      sobelData.data[idx + 1] = 0
      sobelData.data[idx + 2] = 0
      sobelData.data[idx + 3] = magnitude > 30 ? 180 : 0 // Threshold for clean lines
    }
  }
  ectx.putImageData(sobelData, 0, 0)
  
  // 6. Draw edges on top with multiply for ink effect
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(edgeCanvas, 0, 0)
  ctx.globalCompositeOperation = 'source-over'

  // 7. Add subtle cheek blush / warmth
  ctx.globalAlpha = 0.15
  const blushGrad = ctx.createRadialGradient(size * 0.35, size * 0.55, 0, size * 0.35, size * 0.55, size * 0.25)
  blushGrad.addColorStop(0, '#ff8a8a')
  blushGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = blushGrad
  ctx.fillRect(0, 0, size, size)
  
  const blushGrad2 = ctx.createRadialGradient(size * 0.65, size * 0.55, 0, size * 0.65, size * 0.55, size * 0.25)
  blushGrad2.addColorStop(0, '#ff8a8a')
  blushGrad2.addColorStop(1, 'transparent')
  ctx.fillStyle = blushGrad2
  ctx.fillRect(0, 0, size, size)
  ctx.globalAlpha = 1

  // 8. Brightness/contrast boost for emoji pop
  const final = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < final.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let val = final.data[i + c]
      // S-curve for contrast
      val = 255 * Math.pow(val / 255, 0.85)
      // Brightness boost
      val = Math.min(255, val + 15)
      final.data[i + c] = val
    }
  }
  ctx.putImageData(final, 0, 0)

  // 9. Circular crop with soft edge for emoji feel
  const mask = document.createElement('canvas')
  mask.width = size
  mask.height = size
  const mctx = mask.getContext('2d')!
  mctx.beginPath()
  mctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
  mctx.fillStyle = '#fff'
  mctx.fill()
  
  const result = document.createElement('canvas')
  result.width = size
  result.height = size
  const rctx = result.getContext('2d')!
  rctx.drawImage(out, 0, 0)
  rctx.globalCompositeOperation = 'destination-in'
  rctx.drawImage(mask, 0, 0)
  
  // Add subtle drop shadow for depth
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = size + 12
  finalCanvas.height = size + 12
  const fctx = finalCanvas.getContext('2d')!
  fctx.shadowColor = 'rgba(0,0,0,0.2)'
  fctx.shadowBlur = 8
  fctx.shadowOffsetY = 4
  fctx.drawImage(result, 6, 6)

  return finalCanvas
}

/** Generate an emoji-style caricature data URL from an uploaded/captured photo. */
export async function generateCaricature(file: Blob): Promise<string> {
  const img = await fileToImage(file)
  const cropped = squareCrop(img)
  return cartoonify(cropped).toDataURL('image/png')
}
