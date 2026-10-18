import type {
  MemoriesService,
  MemoryAlbum,
  Memory,
  MemoryErrorCode,
  NewMemory,
  Result,
} from '@/services/memories/types'

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function fail(code: MemoryErrorCode): Result<never> {
  return { ok: false, error: { code } }
}

/** Reserved, so the failure path is reachable by hand and in tests. */
const OFFLINE_MARKER = 'offline'

type MockOptions = {
  latencyMs?: number
  /**
   * Seed memories. Empty by DEFAULT — a new couple genuinely has none, and the
   * home screen's empty state is the first thing they should see rather than
   * invented content belonging to someone else.
   */
  seed?: Memory[]
  /** Test-only partner drafts, kept hidden until this client submits too. */
  partnerPrivateNotes?: Record<string, string>
  albums?: MemoryAlbum[]
  albumMemories?: Record<string, string[]>
}

export function createMockMemoriesService({
  latencyMs = 600,
  seed = [],
  partnerPrivateNotes = {},
  albums = [],
  albumMemories = {},
}: MockOptions = {}): MemoriesService {
  const store = new Map<string, Memory>(seed.map((m) => [m.id, m]))
  const albumStore = new Map<string, MemoryAlbum>(albums.map((album) => [album.id, album]))
  const membershipStore = new Map<string, Set<string>>(
    Object.entries(albumMemories).map(([albumId, memoryIds]) => [albumId, new Set(memoryIds)]),
  )
  let counter = seed.length
  let albumCounter = albums.length

  const albumWithCount = (album: MemoryAlbum): MemoryAlbum => ({
    ...album,
    count: membershipStore.get(album.id)?.size ?? 0,
  })

  return {
    async list() {
      await wait(latencyMs)

      // Newest first — the design's grid leads with the most recent.
      const all = [...store.values()].sort((a, b) => b.date.localeCompare(a.date))

      return { ok: true, value: all }
    },

    async get({ id }) {
      await wait(latencyMs)

      const found = store.get(id)

      return found ? { ok: true, value: found } : fail('NOT_FOUND')
    },

    async create(input: NewMemory) {
      await wait(latencyMs)

      if (input.location?.trim().toLowerCase() === OFFLINE_MARKER) return fail('NETWORK')

      counter += 1
      const memory: Memory = { ...input, id: `memory-${counter}`, favorite: input.favorite ?? false }
      store.set(memory.id, memory)

      return { ok: true, value: memory }
    },

    async update({ id, ...edit }) {
      await wait(latencyMs)

      const found = store.get(id)
      if (!found) return fail('NOT_FOUND')

      const next = { ...found, ...edit }
      store.set(id, next)

      return { ok: true, value: next }
    },

    async delete({ id }) {
      await wait(latencyMs)

      if (!store.has(id)) return fail('NOT_FOUND')
      store.delete(id)

      return { ok: true, value: undefined }
    },

    async updatePrivateNote({ id, note }) {
      await wait(latencyMs)
      const found = store.get(id)
      if (!found) return fail('NOT_FOUND')
      const value = note.trim()
      if (!value) return fail('UNKNOWN')
      const partner = partnerPrivateNotes[id]
      const next = {
        ...found,
        myPrivateNote: value,
        partnerPrivateNote: partner,
        reciprocalNotesRevealed: partner !== undefined,
      }
      store.set(id, next)
      return { ok: true, value: next }
    },

    async withdrawPrivateNote({ id }) {
      await wait(latencyMs)
      const found = store.get(id)
      if (!found) return fail('NOT_FOUND')
      const next = {
        ...found,
        myPrivateNote: undefined,
        partnerPrivateNote: undefined,
        reciprocalNotesRevealed: false,
      }
      store.set(id, next)
      return { ok: true, value: next }
    },

    async toggleFavorite({ id }) {
      await wait(latencyMs)

      const found = store.get(id)
      if (!found) return fail('NOT_FOUND')

      const next = { ...found, favorite: !found.favorite }
      store.set(id, next)

      return { ok: true, value: next }
    },

    async search({ query }) {
      await wait(latencyMs)

      const q = query.trim().toLowerCase()
      if (!q) return { ok: true, value: [] }

      const hits = [...store.values()].filter((m) =>
        [m.title, m.caption, m.location, m.note, ...m.tags]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q)),
      )

      return { ok: true, value: hits }
    },

    async listAlbums() {
      await wait(latencyMs)
      return { ok: true, value: [...albumStore.values()].map(albumWithCount) }
    },

    async createAlbum(input) {
      await wait(latencyMs)
      const label = input.label.trim()
      const duplicate = [...albumStore.values()].some(
        (album) => album.label.toLowerCase() === label.toLowerCase(),
      )
      if (duplicate) return fail('CONFLICT')

      albumCounter += 1
      const album: MemoryAlbum = {
        id: `album-${albumCounter}`,
        key: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        label,
        emoji: input.emoji,
        coverUri: input.coverUri,
        count: 0,
      }
      albumStore.set(album.id, album)
      membershipStore.set(album.id, new Set())
      return { ok: true, value: album }
    },

    async getAlbum({ id }) {
      await wait(latencyMs)
      const album = albumStore.get(id)
      return album ? { ok: true, value: albumWithCount(album) } : fail('NOT_FOUND')
    },

    async listAlbumMemories({ albumId }) {
      await wait(latencyMs)
      if (!albumStore.has(albumId)) return fail('NOT_FOUND')
      const ids = membershipStore.get(albumId) ?? new Set<string>()
      return {
        ok: true,
        value: [...ids].map((id) => store.get(id)).filter((memory): memory is Memory => Boolean(memory)),
      }
    },

    async addToAlbum({ albumId, memoryId }) {
      await wait(latencyMs)
      if (!albumStore.has(albumId) || !store.has(memoryId)) return fail('NOT_FOUND')
      const ids = membershipStore.get(albumId) ?? new Set<string>()
      ids.add(memoryId)
      membershipStore.set(albumId, ids)
      return { ok: true, value: undefined }
    },

    async removeFromAlbum({ albumId, memoryId }) {
      await wait(latencyMs)
      if (!albumStore.has(albumId)) return fail('NOT_FOUND')
      membershipStore.get(albumId)?.delete(memoryId)
      return { ok: true, value: undefined }
    },
  }
}
