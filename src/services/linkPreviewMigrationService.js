import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '@/firebase/config'

// Both proxied through Vite — no browser CORS preflight.
const SCRAPPER_BASE_URL    = '/api/scrapper'
const LINKPREVIEW_BASE_URL = '/api/linkpreview'

const TIMEOUT_MS = 15_000

const BLOCKED_HOSTNAMES = [
  'flipkart.com',
  'www.flipkart.com',
  'dl.flipkart.com',
]

function isBlockedDomain(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return BLOCKED_HOSTNAMES.some(
      d => hostname === d || hostname.endsWith(`.${d}`)
    )
  } catch {
    return false
  }
}

function abortSignal() {
  const c = new AbortController()
  setTimeout(() => c.abort(), TIMEOUT_MS)
  return c.signal
}

// ---- linkpreview.net -------------------------------------------------------
// Priority for: imageUrl, title, description, imageWidth/imageHeight
// POST https://api.linkpreview.net  { q: url, fields: 'image_x,image_y' }
// Header: X-Linkpreview-Api-Key
// `fields` requests image dimensions on top of the default title/description/image/url.

async function fetchFromLinkPreviewNet(url, apiKey) {
  const response = await fetch(LINKPREVIEW_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Linkpreview-Api-Key': apiKey,
    },
    body: JSON.stringify({ q: url, fields: 'image_x,image_y' }),
    signal: abortSignal(),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(`linkpreview.net returned ${response.status}`)
  }

  const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0)

  // Keep the raw response intact; normalise the fields we rely on.
  return {
    ...data,
    title:       data.title       || '',
    description: data.description || '',
    image:       data.image       || '',
    url:         data.url         || url,
    imageWidth:  num(data.image_x),
    imageHeight: num(data.image_y),
  }
}

// ---- LinkBox scrapper -------------------------------------------------------
// Priority for: preview metadata (provider, type, favicon, metadata object)
// GET /extract?url=...  Header: x-linkbox-token

export async function fetchLinkPreview(url, scraperToken) {
  const params = new URLSearchParams({ url })
  const response = await fetch(
    `${SCRAPPER_BASE_URL}/extract?${params}`,
    {
      headers: { 'x-linkbox-token': scraperToken },
      signal: abortSignal(),
    }
  )

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload.success !== true) {
    throw new Error(payload?.error?.message || `Scrapper returned ${response.status}`)
  }

  return payload
}

// ---- Fetch from both and merge ---------------------------------------------

/**
 * Calls both APIs. linkpreview.net results take priority for the basic fields
 * (imageUrl, title, description); the scrapper provides rich metadata.
 * If linkPreviewNetKey is empty / not provided, falls back to scrapper only.
 */
export async function fetchBothPreviews(url, scraperToken, linkPreviewNetKey) {
  const [scraperResult, linkPreviewResult] = await Promise.allSettled([
    fetchLinkPreview(url, scraperToken),
    linkPreviewNetKey
      ? fetchFromLinkPreviewNet(url, linkPreviewNetKey)
      : Promise.reject(new Error('No linkpreview.net key')),
  ])

  const scraper     = scraperResult.status     === 'fulfilled' ? scraperResult.value     : null
  const linkPreview = linkPreviewResult.status === 'fulfilled' ? linkPreviewResult.value : null

  if (!scraper && !linkPreview) {
    throw new Error('Both preview APIs failed.')
  }

  return { scraper, linkPreview }
}

// ---- Build updates ---------------------------------------------------------

function buildPreviewObject(scraper, linkPreview, fallbackUrl) {
  const str = v => (typeof v === 'string' ? v : '')
  const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})

  // Keep EVERYTHING the scrapper returned (metadata, oembed, and any future
  // fields) — only strip the transport envelope flags.
  const { success, error, ...scraped } = obj(scraper)

  // Basic fields: linkpreview.net wins, scraper is fallback
  const title       = str(linkPreview?.title       || scraped.title)
  const description = str(linkPreview?.description || scraped.description)
  const image       = str(linkPreview?.image       || scraped.image)

  return {
    ...scraped,
    status:      'fetched',
    fetchedAt:   serverTimestamp(),
    source:      str(scraped.source) || 'linkbox-metadata-api',
    url:         str(scraped.url || linkPreview?.url) || fallbackUrl,
    provider:    str(scraped.provider),
    type:        str(scraped.type) || 'website',
    title,
    description,
    image,
    favicon:     str(scraped.favicon),
    metadata:    obj(scraped.metadata),
  }
}

/**
 * Builds the full Firestore updates object from the two API results.
 * Does NOT write anything — use applyLinkPreview to write.
 *
 * Field priority:
 *   imageUrl, title, description  →  linkpreview.net first, scraper fallback
 *   favicon, provider, type, metadata  →  scraper only
 *   imageHeight, imageWidth  →  linkpreview.net (image_x / image_y), 0.0 fallback
 */
export function buildLinkPreviewUpdates(link, scraper, linkPreview) {
  const preview = buildPreviewObject(scraper, linkPreview, link.link || link.url || '')

  // System / metadata fields — always written
  const updates = {
    previewStatus:    'fetched',
    preview,
    previewFetchedAt: serverTimestamp(),
    updatedAt:        serverTimestamp(),
  }

  // Content fields — never overwrite an existing value.
  // String fields: skip if the link already has a non-empty value.
  if (!link.imageUrl    && preview.image)       updates.imageUrl    = preview.image
  if (!link.title       && preview.title)       updates.title       = preview.title
  if (!link.description && preview.description) updates.description = preview.description

  // Dimensions from linkpreview.net. A stored 0 is a placeholder, not a real
  // value, so fetched dimensions may replace it — but never a non-zero one.
  // When we got no dimensions, only backfill 0.0 on docs missing the field.
  const height = linkPreview?.imageHeight > 0 ? linkPreview.imageHeight : 0
  const width  = linkPreview?.imageWidth  > 0 ? linkPreview.imageWidth  : 0

  if (height && !(link.imageHeight > 0)) updates.imageHeight = height
  else if (link.imageHeight == null)     updates.imageHeight = 0.0

  if (width && !(link.imageWidth > 0))   updates.imageWidth  = width
  else if (link.imageWidth == null)      updates.imageWidth  = 0.0

  return updates
}

/**
 * Returns a display-safe version of the updates (no serverTimestamp sentinels).
 * Shows the FULL updates object — exactly what will be written — so nothing
 * looks like it was dropped in the confirm dialog.
 */
export function buildDisplayUpdates(link, scraper, linkPreview) {
  const clean = v => {
    if (v && typeof v === 'object') {
      // serverTimestamp() sentinel or a Firestore Timestamp instance
      if (typeof v._methodName === 'string') return '<server timestamp>'
      if ('seconds' in v || typeof v.toDate === 'function') return '<timestamp>'
      if (Array.isArray(v)) return v.map(clean)
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)]))
    }
    return v
  }

  return clean(buildLinkPreviewUpdates(link, scraper, linkPreview))
}

/**
 * Applies the preview updates to Firestore.
 */
export async function applyLinkPreview(link, scraper, linkPreview) {
  const updates = buildLinkPreviewUpdates(link, scraper, linkPreview)
  await updateDoc(doc(db, 'links', link.id), updates)
  return updates
}

async function markFailed(linkId, url, message) {
  await updateDoc(doc(db, 'links', linkId), {
    previewStatus: 'failed',
    preview: {
      status: 'failed',
      source: 'linkbox-metadata-api',
      url,
      metadata: {},
      error: message?.slice(0, 160) || 'Preview fetch failed.',
    },
    updatedAt: serverTimestamp(),
  })
}

/**
 * Returns all link documents that still need a preview.
 * Excludes hard-deleted links.
 */
export async function getLinksMissingPreview() {
  const snapshot = await getDocs(collection(db, 'links'))

  return snapshot.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
    .filter(link => {
      if (link.isDeleted === true || link.IsDeleted === true) return false
      return link.previewStatus !== 'fetched'
    })
}

/**
 * Bulk migration — calls both APIs per link and writes merged result.
 */
export async function runPreviewMigration(scraperToken, linkPreviewNetKey, onProgress, concurrency = 5) {
  const links = await getLinksMissingPreview()

  let processed = 0
  let succeeded = 0
  let failed    = 0
  let skipped   = 0
  const total   = links.length

  function tick() {
    onProgress?.({ processed, total, succeeded, failed, skipped })
  }

  for (let i = 0; i < links.length; i += concurrency) {
    const batch = links.slice(i, i + concurrency)

    await Promise.allSettled(
      batch.map(async link => {
        const url = (link.link || link.url || '').trim()

        if (!url) {
          await markFailed(link.id, '', 'Missing link URL.')
          failed++
          processed++
          tick()
          return
        }

        if (isBlockedDomain(url)) {
          skipped++
          processed++
          tick()
          return
        }

        try {
          const { scraper, linkPreview } = await fetchBothPreviews(url, scraperToken, linkPreviewNetKey)
          await applyLinkPreview(link, scraper, linkPreview)
          succeeded++
        } catch (error) {
          const message =
            error.name === 'AbortError'
              ? 'Request timed out.'
              : error.message?.slice(0, 160) || 'Preview fetch failed.'
          await markFailed(link.id, url, message).catch(() => {})
          failed++
        }

        processed++
        tick()
      })
    )

    if (i + concurrency < links.length) {
      await new Promise(r => setTimeout(r, 2500))
    }
  }

  return { total, succeeded, failed, skipped }
}
