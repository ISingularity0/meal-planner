import zlib from 'node:zlib'
import fs from 'node:fs'

// Draws the app icon (plate + cutlery, warm sage palette) with no image dependencies:
// shapes are rasterised with 3x3 supersampling, then encoded as a PNG by hand.

const BG_TOP = [0x92, 0xab, 0x88]
const BG_BOTTOM = [0x6d, 0x85, 0x66]
const CREAM = [0xff, 0xfa, 0xf1]
const CREAM_SHADE = [0xef, 0xe2, 0xcd]

function crc32(buf) {
  const table = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function circle(cx, cy, r) {
  return (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

function roundedRect(cx, cy, w, h, radius) {
  const hw = w / 2
  const hh = h / 2
  const r = Math.min(radius, hw, hh)
  return (x, y) => {
    const dx = Math.abs(x - cx) - (hw - r)
    const dy = Math.abs(y - cy) - (hh - r)
    if (dx <= 0 || dy <= 0) return Math.abs(x - cx) <= hw && Math.abs(y - cy) <= hh
    return dx * dx + dy * dy <= r * r
  }
}

function union(...shapes) {
  return (x, y) => shapes.some((inside) => inside(x, y))
}

function draw(size) {
  // Pixel buffer, pre-filled with a soft vertical gradient background.
  const px = new Float64Array(size * size * 3)
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3
      for (let c = 0; c < 3; c++) {
        px[i + c] = BG_TOP[c] + (BG_BOTTOM[c] - BG_TOP[c]) * t
      }
    }
  }

  // Coverage via 3x3 supersampling, so curves come out smooth rather than jagged.
  const paint = (inside, color) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let hits = 0
        for (let sy = 0; sy < 3; sy++) {
          for (let sx = 0; sx < 3; sx++) {
            const u = (x + (sx + 0.5) / 3) / size
            const v = (y + (sy + 0.5) / 3) / size
            if (inside(u, v)) hits++
          }
        }
        if (!hits) continue
        const a = hits / 9
        const i = (y * size + x) * 3
        for (let c = 0; c < 3; c++) {
          px[i + c] = px[i + c] * (1 - a) + color[c] * a
        }
      }
    }
  }

  // Fork: three tines above a handle.
  paint(
    union(
      roundedRect(0.212, 0.335, 0.019, 0.17, 0.01),
      roundedRect(0.255, 0.335, 0.019, 0.17, 0.01),
      roundedRect(0.298, 0.335, 0.019, 0.17, 0.01),
      roundedRect(0.255, 0.44, 0.105, 0.075, 0.03),
      roundedRect(0.255, 0.6, 0.05, 0.26, 0.025)
    ),
    CREAM
  )

  // Knife: tapered blade over a handle.
  paint(
    union(
      roundedRect(0.745, 0.39, 0.055, 0.28, 0.027),
      roundedRect(0.745, 0.62, 0.05, 0.22, 0.025)
    ),
    CREAM
  )

  // Plate.
  paint(circle(0.5, 0.5, 0.235), CREAM)
  paint(circle(0.5, 0.5, 0.17), CREAM_SHADE)
  paint(circle(0.5, 0.5, 0.155), CREAM)

  const rowLen = size * 3 + 1
  const raw = Buffer.alloc(rowLen * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * rowLen
    raw[rowStart] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3
      const o = rowStart + 1 + x * 3
      for (let c = 0; c < 3; c++) {
        raw[o + c] = Math.max(0, Math.min(255, Math.round(px[i + c])))
      }
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor (RGB)
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idatData = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idatData), chunk('IEND', Buffer.alloc(0))])
}

fs.mkdirSync('public/icons', { recursive: true })
fs.writeFileSync('public/icons/icon-192.png', draw(192))
fs.writeFileSync('public/icons/icon-512.png', draw(512))
console.log('Generated app icons in public/icons/')
