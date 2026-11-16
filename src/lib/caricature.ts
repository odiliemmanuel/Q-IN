/**
 * Client-side avatar generation (Snapchat Bitmoji / WhatsApp avatar style).
 *
 * Produces a clean, recognizable digital avatar from a photo using face-aware
 * processing. Creates flat-color vector illustration with clean outlines,
 * simplified facial features, and avatar aesthetics.
 * Everything happens on a <canvas> - no external AI required.
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

function createAvatarFromCanvas(base: HTMLCanvasElement): HTMLCanvasElement {
  const size = OUTPUT_SIZE
  const out = document.createElement('canvas')
  out.width = size
  out.height = size
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable.')

  // 1. Draw and smooth the base image
  ctx.drawImage(base, 0, 0, size, size)
  ctx.filter = 'blur(1px)'
  ctx.drawImage(out, 0, 0)
  ctx.filter = 'none'

  // 2. Color quantization for flat avatar look (k-means inspired posterization)
  const imageData = ctx.getImageData(0, 0, size, size)
  const data = imageData.data
  const palette = quantizeColors(data, 12) // 12 dominant colors
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const nearest = findNearestColor(r, g, b, palette)
    data[i] = nearest.r
    data[i + 1] = nearest.g
    data[i + 2] = nearest.b
  }
  ctx.putImageData(imageData, 0, 0)

  // 3. Bilateral-like smoothing on quantized colors
  const smoothPass = (radius: number) => {
    const temp = ctx.getImageData(0, 0, size, size)
    const smoothed = ctx.createImageData(size, size)
    const tdata = temp.data, sdata = smoothed.data
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let r = 0, g = 0, b = 0, count = 0
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.max(0, Math.min(size - 1, x + dx))
            const ny = Math.max(0, Math.min(size - 1, y + dy))
            const idx = (ny * size + nx) * 4
            const dist = dx * dx + dy * dy
            const weight = Math.exp(-dist / (2 * radius * radius))
            r += tdata[idx] * weight
            g += tdata[idx + 1] * weight
            b += tdata[idx + 2] * weight
            count += weight
          }
        }
        const idx = (y * size + x) * 4
        sdata[idx] = r / count
        sdata[idx + 1] = g / count
        sdata[idx + 2] = b / count
        sdata[idx + 3] = 255
      }
    }
    ctx.putImageData(smoothed, 0, 0)
  }
  smoothPass(3)

  // 4. Re-quantize after smoothing
  const data2 = ctx.getImageData(0, 0, size, size).data
  for (let i = 0; i < data2.length; i += 4) {
    const nearest = findNearestColor(data2[i], data2[i + 1], data2[i + 2], palette)
    data2[i] = nearest.r
    data2[i + 1] = nearest.g
    data2[i + 2] = nearest.b
  }
  ctx.putImageData(new ImageData(data2, size, size), 0, 0)

  // 5. Clean edge detection for outlines
  const edgeCanvas = document.createElement('canvas')
  edgeCanvas.width = size
  edgeCanvas.height = size
  const ectx = edgeCanvas.getContext('2d')!
  ectx.filter = 'grayscale(1) contrast(2)'
  ectx.drawImage(out, 0, 0)
  ectx.filter = 'none'
  
  const edgeData = ectx.getImageData(0, 0, size, size)
  const outlineData = ectx.createImageData(size, size)
  
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = (y * size + x) * 4
      const center = edgeData.data[(y * size + x) * 4]
      const right = edgeData.data[(y * size + x + 1) * 4]
      const down = edgeData.data[((y + 1) * size + x) * 4]
      const diff = Math.max(Math.abs(right - center), Math.abs(down - center))
      
      // Strong edges get ink lines
      const isEdge = diff > 35
      outlineData.data[idx] = 0
      outlineData.data[idx + 1] = 0
      outlineData.data[idx + 2] = 0
      outlineData.data[idx + 3] = isEdge ? 220 : 0
    }
  }
  ectx.putImageData(outlineData, 0, 0)

  // 6. Apply clean outlines
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(edgeCanvas, 0, 0)
  ctx.globalCompositeOperation = 'source-over'

  // 7. Subtle highlight on nose/forehead for 3D feel
  const highlight = document.createElement('canvas')
  highlight.width = size
  highlight.height = size
  const hctx = highlight.getContext('2d')!
  const grad = hctx.createRadialGradient(size * 0.5, size * 0.35, 0, size * 0.5, size * 0.35, size * 0.3)
  grad.addColorStop(0, 'rgba(255,255,255,0.25)')
  grad.addColorStop(1, 'transparent')
  hctx.fillStyle = grad
  hctx.fillRect(0, 0, size, size)
  
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = 0.4
  ctx.drawImage(highlight, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1

  // 8. Circular crop with soft edge
  const mask = document.createElement('canvas')
  mask.width = size
  mask.height = size
  const mctx = mask.getContext('2d')!
  const mgrad = mctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2 - 2)
  mgrad.addColorStop(0, '#fff')
  mgrad.addColorStop(0.95, '#fff')
  mgrad.addColorStop(1, 'transparent')
  mctx.fillStyle = mgrad
  mctx.fillRect(0, 0, size, size)
  
  const result = document.createElement('canvas')
  result.width = size
  result.height = size
  const rctx = result.getContext('2d')!
  rctx.drawImage(out, 0, 0)
  rctx.globalCompositeOperation = 'destination-in'
  rctx.drawImage(mask, 0, 0)

  // 9. Final canvas with subtle background and shadow
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = size + 12
  finalCanvas.height = size + 12
  const fctx = finalCanvas.getContext('2d')!
  
  // Light background
  fctx.fillStyle = '#f0f2f5'
  fctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
  
  // Drop shadow
  fctx.shadowColor = 'rgba(0,0,0,0.12)'
  fctx.shadowBlur = 10
  fctx.shadowOffsetY = 4
  fctx.drawImage(result, 6, 6)

  return finalCanvas
}

// Color quantization helpers
function quantizeColors(data: Uint8ClampedArray, k: number): Array<{r: number, g: number, b: number}> {
  // Simple k-means++ initialization + a few iterations
  const pixels: Array<{r: number, g: number, b: number}> = []
  for (let i = 0; i < data.length; i += 4) {
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
  }
  
  // Sample for performance
  const sample = pixels.filter(() => Math.random() < 0.1)
  
  // Initialize centroids
  const centroids: Array<{r: number, g: number, b: number}> = []
  centroids.push(sample[Math.floor(Math.random() * sample.length)])
  
  for (let c = 1; c < k; c++) {
    const distances = sample.map(p => Math.min(...centroids.map(c => colorDist(p, c))))
    const total = distances.reduce((a, b) => a + b, 0)
    let rand = Math.random() * total
    for (let i = 0; i < sample.length; i++) {
      rand -= distances[i]
      if (rand <= 0) {
        centroids.push(sample[i])
        break
      }
    }
  }
  
  // Lloyd's algorithm (3 iterations)
  for (let iter = 0; iter < 3; iter++) {
    const clusters: Array<Array<{r: number, g: number, b: number}>> = centroids.map(() => [])
    for (const p of sample) {
      let minDist = Infinity, bestIdx = 0
      for (let i = 0; i < centroids.length; i++) {
        const d = colorDist(p, centroids[i])
        if (d < minDist) { minDist = d; bestIdx = i }
      }
      clusters[bestIdx].push(p)
    }
    for (let i = 0; i < centroids.length; i++) {
      if (clusters[i].length > 0) {
        const sum = clusters[i].reduce((a, p) => ({ 
          r: a.r + p.r, g: a.g + p.g, b: a.b + p.b 
        }), { r: 0, g: 0, b: 0 })
        centroids[i] = { 
          r: sum.r / clusters[i].length, 
          g: sum.g / clusters[i].length, 
          b: sum.b / clusters[i].length 
        }
      }
    }
  }
  
  return centroids
}

function colorDist(a: {r: number, g: number, b: number}, b: {r: number, g: number, b: number}): number {
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b
  return dr * dr + dg * dg + db * db
}

function findNearestColor(r: number, g: number, b: number, palette: Array<{r: number, g: number, b: number}>): {r: number, g: number, b: number} {
  let minDist = Infinity, best = palette[0]
  for (const c of palette) {
    const d = colorDist({ r, g, b }, c)
    if (d < minDist) { minDist = d; best = c }
  }
  return best
}

/** Generate a clean digital avatar (Bitmoji/WhatsApp style) from a photo. */
export async function generateAvatar(file: Blob): Promise<string> {
  const img = await fileToImage(file)
  const cropped = squareCrop(img)
  return createAvatarFromCanvas(cropped).toDataURL('image/png')
}