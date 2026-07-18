import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  processAvatar,
  MAX_UPLOAD_BYTES,
  AVATAR_OUTPUT_SIZE,
  WEBP_QUALITY,
} from './avatar-processing'

// The pipeline is: MIME check → size check → createImageBitmap → canvas encode.
// Node environment has neither createImageBitmap nor a canvas 2D context, so
// tests either stop before the decode step (validation) or stub the globals
// enough to observe which branch was taken (decode-failed / encode-failed).

// Build a File without touching disk. Passing raw string bytes is fine — the
// processor only reads .type and .size before the decode step.
function makeFile(size: number, type: string, name = 'x'): File {
  // A tiny payload padded with a Uint8Array of the requested length keeps
  // memory reasonable while making file.size honest.
  const bytes = new Uint8Array(size)
  return new File([bytes], name, { type })
}

describe('avatar-processing constants', () => {
  it('caps upload at 5 MB', () => {
    expect(MAX_UPLOAD_BYTES).toBe(5 * 1024 * 1024)
  })

  it('encodes to 256×256 WebP at quality 0.85', () => {
    expect(AVATAR_OUTPUT_SIZE).toBe(256)
    expect(WEBP_QUALITY).toBe(0.85)
  })
})

describe('processAvatar — validation', () => {
  it('rejects non-image files with wrong-type', async () => {
    const file = makeFile(1024, 'application/pdf', 'doc.pdf')
    const result = await processAvatar(file)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe('wrong-type')
      if (result.error.kind === 'wrong-type') {
        expect(result.error.mime).toBe('application/pdf')
      }
    }
  })

  it('rejects empty-type files', async () => {
    const file = makeFile(1024, '', 'unknown')
    const result = await processAvatar(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.kind).toBe('wrong-type')
  })

  it('rejects files above 5 MB even if the MIME is fine', async () => {
    const file = makeFile(MAX_UPLOAD_BYTES + 1, 'image/jpeg', 'big.jpg')
    const result = await processAvatar(file)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe('too-big')
      if (result.error.kind === 'too-big') {
        expect(result.error.sizeBytes).toBe(MAX_UPLOAD_BYTES + 1)
      }
    }
  })

  it('accepts a file exactly at the 5 MB limit past the size gate', async () => {
    // Right at the boundary: NOT rejected as too-big. It'll fail later at
    // decode (no browser APIs in node), but the specific error confirms the
    // size check treats <= as ok.
    const file = makeFile(MAX_UPLOAD_BYTES, 'image/jpeg', 'edge.jpg')
    const result = await processAvatar(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.kind).not.toBe('too-big')
  })
})

describe('processAvatar — decode/encode paths (mocked)', () => {
  const origCreateImageBitmap = (globalThis as any).createImageBitmap
  const origCreateElement = globalThis.document?.createElement

  afterEach(() => {
    if (origCreateImageBitmap === undefined) delete (globalThis as any).createImageBitmap
    else (globalThis as any).createImageBitmap = origCreateImageBitmap
    if (globalThis.document && origCreateElement) globalThis.document.createElement = origCreateElement
  })

  it('reports decode-failed when createImageBitmap throws', async () => {
    ;(globalThis as any).createImageBitmap = vi.fn().mockRejectedValue(new Error('boom'))
    const file = makeFile(1024, 'image/jpeg')
    const result = await processAvatar(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.kind).toBe('decode-failed')
  })

  it('reports encode-failed when canvas encoding is unavailable', async () => {
    ;(globalThis as any).createImageBitmap = vi.fn().mockResolvedValue({
      width: 800,
      height: 600,
      close: vi.fn(),
    })
    // Stub just enough of document + canvas for the code path: canvas.getContext
    // returns a minimal 2D context; canvas.toBlob calls back with null so the
    // encode step fails deterministically.
    ;(globalThis as any).document = globalThis.document ?? {}
    ;(globalThis.document as any).createElement = vi.fn(() => ({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn() }),
      toBlob: (cb: (b: Blob | null) => void) => cb(null),
    }))
    const file = makeFile(1024, 'image/jpeg')
    const result = await processAvatar(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.kind).toBe('encode-failed')
  })
})
