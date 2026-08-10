export function resolveModelUrl(path?: string): string | undefined {
  if (!path) return undefined

  const normalized = path.trim().replace(/\\/g, '/')

  // Already a network or Vite /@fs URL
  if (/^https?:\/\//i.test(normalized)) return normalized
  if (normalized.startsWith('/@fs/')) return normalized

  // Root-relative path (e.g. /models/body.glb)
  if (normalized.startsWith('/')) return normalized

  // Windows drive letter absolute path, e.g. G:/...
  if (/^[a-z]:\//i.test(normalized)) {
    // Dev server provides a stable middleware endpoint to avoid
    // cross-drive /@fs/ and non-ASCII path encoding issues on Windows.
    if (import.meta.env.DEV) {
      return '/__local-model/body.glb'
    }
    return `/@fs/${normalized}`
  }

  // Unix absolute path
  if (normalized.startsWith('/')) {
    if (import.meta.env.DEV) {
      return '/__local-model/body.glb'
    }
    return `/@fs/${normalized}`
  }

  // Relative path
  return normalized
}
