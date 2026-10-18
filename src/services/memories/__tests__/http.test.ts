import { del, get, patch, post, put, request } from '@/services/http/client'
import { ensureRemoteUri } from '@/services/media'
import { createHttpMemoriesService } from '@/services/memories/http'

jest.mock('@/config/env', () => ({ requireApiUrl: jest.fn(() => 'http://localhost:4000/v1') }))
jest.mock('@/services/http/client', () => ({
  del: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  request: jest.fn(),
}))
jest.mock('@/services/media', () => ({ ensureRemoteUri: jest.fn((uri) => Promise.resolve(uri)) }))

const mockDel = jest.mocked(del)
const mockGet = jest.mocked(get)
const mockPatch = jest.mocked(patch)
const mockPost = jest.mocked(post)
const mockPut = jest.mocked(put)
const mockRequest = jest.mocked(request)
const mockEnsureRemoteUri = jest.mocked(ensureRemoteUri)
const memory = {
  id: 'memory-1',
  title: 'Sunset',
  date: '2026-10-12',
  tags: ['Trips'],
  favorite: false,
}
const album = {
  id: 'album-1',
  key: 'trips',
  label: 'Trips',
  emoji: '✈️',
  coverUri: null,
  count: 1,
}

describe('HTTP Memories service', () => {
  beforeEach(() => jest.clearAllMocks())

  it('uses the backend PATCH contract when editing a memory', async () => {
    mockEnsureRemoteUri.mockResolvedValue(undefined)
    mockPatch.mockResolvedValueOnce({ ...memory, title: 'New title' })

    const result = await createHttpMemoriesService().update({ id: memory.id, title: 'New title' })

    expect(mockPatch).toHaveBeenCalledWith('/memories/memory-1', expect.objectContaining({
      title: 'New title',
    }))
    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({ ...memory, title: 'New title', reciprocalNotesRevealed: false }),
    })
  })

  it('lists and reads authoritative albums', async () => {
    mockGet.mockResolvedValueOnce([album]).mockResolvedValueOnce(album)
    const service = createHttpMemoriesService()

    expect(await service.listAlbums()).toEqual({
      ok: true,
      value: [{ ...album, emoji: '✈️', coverUri: undefined }],
    })
    expect(await service.getAlbum({ id: album.id })).toEqual({
      ok: true,
      value: { ...album, emoji: '✈️', coverUri: undefined },
    })
    expect(mockGet).toHaveBeenNthCalledWith(1, '/memories/albums')
    expect(mockGet).toHaveBeenNthCalledWith(2, '/memories/albums/album-1')
  })

  it('uploads an optional cover and creates an album', async () => {
    mockEnsureRemoteUri.mockResolvedValueOnce('https://cdn.example/cover.jpg')
    mockPost.mockResolvedValueOnce(album)

    const result = await createHttpMemoriesService().createAlbum({
      label: 'Trips',
      emoji: '✈️',
      coverUri: 'file:///cover.jpg',
    })

    expect(mockEnsureRemoteUri).toHaveBeenCalledWith('file:///cover.jpg')
    expect(mockPost).toHaveBeenCalledWith('/memories/albums', {
      label: 'Trips',
      emoji: '✈️',
      coverUrl: 'https://cdn.example/cover.jpg',
    })
    expect(result).toEqual({
      ok: true,
      value: { ...album, emoji: '✈️', coverUri: undefined },
    })
  })

  it('lists album memories with the album filter', async () => {
    mockRequest.mockResolvedValueOnce({ data: [memory], meta: { nextCursor: null } })

    const result = await createHttpMemoriesService().listAlbumMemories({ albumId: album.id })

    expect(mockRequest).toHaveBeenCalledWith('/memories', {
      query: { albumId: album.id, cursor: undefined, limit: 100 },
    })
    expect(result.ok).toBe(true)
  })

  it('adds and removes album membership through the dedicated endpoints', async () => {
    mockPut.mockResolvedValueOnce(undefined)
    mockDel.mockResolvedValueOnce(undefined)
    const service = createHttpMemoriesService()

    expect(await service.addToAlbum({ albumId: album.id, memoryId: memory.id }))
      .toEqual({ ok: true, value: undefined })
    expect(await service.removeFromAlbum({ albumId: album.id, memoryId: memory.id }))
      .toEqual({ ok: true, value: undefined })
    expect(mockPut).toHaveBeenCalledWith('/memories/albums/album-1/memories/memory-1')
    expect(mockDel).toHaveBeenCalledWith('/memories/albums/album-1/memories/memory-1')
  })
})
