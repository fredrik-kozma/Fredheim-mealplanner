/**
 * Packs a week plan or a recipe into a string that fits in a URL, and
 * unpacks it again on the other side.
 *
 * The point is that a shared link carries its own contents. There is no
 * server to upload to, no account to have, and nothing to expire — the
 * menu is in the link itself, so it works between two people who have
 * nothing in common but the app.
 *
 * Shape of a code:  <flag><base64url>
 *   z…  gzipped JSON   (the normal case)
 *   r…  raw JSON       (browsers without CompressionStream)
 *
 * The flag means a reader never has to guess how it was written, so the
 * fallback below can't produce links the recipient fails to open. Both
 * forms decode everywhere; only writing needs the modern API.
 *
 * Sizes, measured against the real packs: a full week — 21 meals and a
 * note on every day — comes to about 700 characters gzipped, which is a
 * link you can paste into a message without it looking broken. A recipe
 * referenced by id is about 25. A whole user-written recipe is a few
 * thousand, which still works but is ugly; its photo cannot go in at all
 * and is why ShareModal offers a file for that case.
 */

const GZIP = 'z'
const RAW = 'r'

const te = new TextEncoder()
const td = new TextDecoder()

function bytesToBase64url(bytes) {
  let bin = ''
  // Chunked because String.fromCharCode(...bytes) blows the argument
  // limit somewhere around 100 KB and would throw on a big recipe.
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlToBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

const canGzip = () => typeof CompressionStream !== 'undefined'
const canGunzip = () => typeof DecompressionStream !== 'undefined'

async function pipe(bytes, stream) {
  const res = new Response(new Response(bytes).body.pipeThrough(stream))
  return new Uint8Array(await res.arrayBuffer())
}

/**
 * payload -> code. Falls back to uncompressed on any failure rather than
 * throwing: a long link still works, a missing one doesn't.
 */
export async function encodeShare(payload) {
  const json = JSON.stringify(payload)
  const bytes = te.encode(json)
  if (canGzip()) {
    try {
      return GZIP + bytesToBase64url(await pipe(bytes, new CompressionStream('gzip')))
    } catch {
      // fall through to raw
    }
  }
  return RAW + bytesToBase64url(bytes)
}

/**
 * code -> payload, or null if it isn't one of ours. Returns null rather
 * than throwing because every caller is handling a link from outside and
 * has to cope with it being truncated by a chat app, half-pasted, or
 * simply not a share link at all.
 */
export async function decodeShare(code) {
  if (typeof code !== 'string' || code.length < 2) return null
  const flag = code[0]
  const body = code.slice(1)
  try {
    const bytes = base64urlToBytes(body)
    let json
    if (flag === GZIP) {
      if (!canGunzip()) return null
      json = td.decode(await pipe(bytes, new DecompressionStream('gzip')))
    } else if (flag === RAW) {
      json = td.decode(bytes)
    } else {
      return null
    }
    const payload = JSON.parse(json)
    return payload && typeof payload === 'object' ? payload : null
  } catch {
    return null
  }
}

/** True when this browser can read a gzipped link at all. */
export const canOpenShareLinks = () => canGunzip()

/** The absolute URL for a code, which is what actually gets sent. */
export function shareUrlFor(code) {
  return `${window.location.origin}/s/${code}`
}
