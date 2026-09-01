/**
 * compress-existing-images.mjs
 * ─────────────────────────────────────────────────────────────────
 * Descarga todas las imágenes del bucket "productos" en Supabase,
 * las comprime (máx 800 px, JPEG 75 %) y las vuelve a subir con el
 * mismo nombre de archivo → las URLs en la base de datos NO cambian.
 *
 * Ejecutar UNA SOLA VEZ:
 *   node compress-existing-images.mjs
 * ─────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// ─── Config ───────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://whockkrmhhbhdsaaqrpc.supabase.co'
const SUPABASE_KEY  = 'sb_publishable_uv_ZS9IJE9a-6iV692i23Q_gN77v9Ua'
const BUCKET        = 'productos'
const MAX_PX        = 800   // lado máximo en píxeles
const QUALITY       = 75    // calidad JPEG (0-100)
// ──────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  // 1. Listar todos los archivos del bucket
  const { data: files, error: listErr } = await supabase.storage.from(BUCKET).list('', {
    limit: 1000,
    offset: 0,
  })
  if (listErr) { console.error('Error listando archivos:', listErr.message); process.exit(1) }
  if (!files || files.length === 0) { console.log('No hay archivos en el bucket.'); return }

  console.log(`\n📦 Encontradas ${files.length} imagen(es) en el bucket "${BUCKET}".\n`)

  let ok = 0, skip = 0, fail = 0

  for (const file of files) {
    const name = file.name
    if (!name.match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i)) {
      console.log(`  ⬛ Saltando (no imagen): ${name}`)
      skip++
      continue
    }

    process.stdout.write(`  🔄 ${name} ... `)

    try {
      // 2. Descargar la imagen
      const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(name)
      if (dlErr) throw new Error(dlErr.message)

      const originalBuffer = Buffer.from(await blob.arrayBuffer())
      const originalKB     = Math.round(originalBuffer.byteLength / 1024)

      // 3. Comprimir con sharp
      const compressed = await sharp(originalBuffer)
        .resize(MAX_PX, MAX_PX, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer()

      const compressedKB = Math.round(compressed.byteLength / 1024)

      // Saltar si ya está muy pequeña (< 50 KB) o si la compresión no ayudó
      if (compressedKB >= originalKB) {
        console.log(`✅ Ya optimizada (${originalKB} KB), sin cambios.`)
        skip++
        continue
      }

      // 4. Re-subir con el mismo nombre (upsert → reemplaza en el mismo path)
      const newName = name.replace(/\.[^.]+$/, '.jpg')  // asegura extensión .jpg
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(newName, compressed, {
        upsert:      true,
        contentType: 'image/jpeg',
        cacheControl: '31536000',
      })
      if (upErr) throw new Error(upErr.message)

      const saved = Math.round((1 - compressedKB / originalKB) * 100)
      console.log(`✅ ${originalKB} KB → ${compressedKB} KB  (${saved}% menos)`)
      ok++
    } catch (err) {
      console.log(`❌ Error: ${err.message}`)
      fail++
    }
  }

  console.log(`\n─────────────────────────────────────────`)
  console.log(`✅ Comprimidas : ${ok}`)
  console.log(`⬛ Sin cambios : ${skip}`)
  console.log(`❌ Errores     : ${fail}`)
  console.log(`─────────────────────────────────────────\n`)
}

main()
