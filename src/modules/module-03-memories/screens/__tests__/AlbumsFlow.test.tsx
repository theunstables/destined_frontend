import { screen, userEvent } from '@testing-library/react-native'

import { ALBUMS_COPY as COPY } from '@/copy/albums'
import { AlbumDetailScreen } from '@/modules/module-03-memories/screens/AlbumDetailScreen'
import { AlbumsScreen } from '@/modules/module-03-memories/screens/AlbumsScreen'
import { CreateAlbumScreen } from '@/modules/module-03-memories/screens/CreateAlbumScreen'
import { SAMPLE_ALBUMS, memoriesInAlbum } from '@/sample/albums'
import { SAMPLE_HOME } from '@/sample/home'
import { memoriesService } from '@/services/memories'
import { renderScreen } from '@/test/renderScreen'

const mockPush = jest.fn()
const mockBack = jest.fn()
const mockReplace = jest.fn()
let mockKey = 'Trips'

jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ key: mockKey }),
}))
jest.mock('@/services/memories', () => ({
  memoriesService: {
    listAlbums: jest.fn(async () => ({ ok: true, value: [] })),
    createAlbum: jest.fn(),
    getAlbum: jest.fn(async () => ({ ok: false, error: { code: 'NOT_FOUND' } })),
    listAlbumMemories: jest.fn(async () => ({ ok: true, value: [] })),
    removeFromAlbum: jest.fn(),
  },
}))

const service = jest.mocked(memoriesService)

beforeEach(() => {
  jest.clearAllMocks()
  mockPush.mockClear()
  mockBack.mockClear()
  mockKey = 'Trips'
  service.listAlbums.mockResolvedValue({ ok: true, value: [] })
  service.createAlbum.mockResolvedValue({
    ok: true,
    value: { id: 'album-9', key: 'weekends', label: 'Weekends', count: 0 },
  })
  service.getAlbum.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND' } })
  service.listAlbumMemories.mockResolvedValue({ ok: true, value: [] })
})

describe('M03-S05 Your albums', () => {
  it('draws every album the design lists', async () => {
    await renderScreen(<AlbumsScreen />)

    expect(screen.getByText(COPY.list.heading)).toBeTruthy()

    for (const album of SAMPLE_ALBUMS) {
      expect(screen.getByTestId(`album-cover-${album.key}`)).toBeTruthy()
    }
  })

  it('reads each cover out with its count, not as a bare image', async () => {
    await renderScreen(<AlbumsScreen />)

    const trips = SAMPLE_ALBUMS.find((a) => a.key === 'Trips')!

    expect(
      screen.getByLabelText(`${trips.label}, ${COPY.list.count(trips.sampleCount)}`),
    ).toBeTruthy()
  })

  it('opens an album, encoding a key that contains a space', async () => {
    const user = userEvent.setup()
    await renderScreen(<AlbumsScreen />)

    const little = SAMPLE_ALBUMS.find((a) => a.key === 'Little Things')!

    await user.press(
      screen.getByLabelText(`${little.label}, ${COPY.list.count(little.sampleCount)}`),
    )

    expect(mockPush).toHaveBeenCalledWith('/(app)/memories/albums/Little%20Things')
  })

  it('opens the create-album form', async () => {
    const user = userEvent.setup()
    await renderScreen(<AlbumsScreen />)

    await user.press(screen.getByRole('button', { name: COPY.list.create }))

    expect(mockPush).toHaveBeenCalledWith('/(app)/memories/albums/new')
  })
})

describe('M03-S07 Create Album', () => {
  it('creates a trimmed album and replaces into its detail route', async () => {
    const user = userEvent.setup()
    await renderScreen(<CreateAlbumScreen />)

    await user.type(screen.getByLabelText(COPY.create.nameLabel), '  Weekends  ')
    await user.type(screen.getByLabelText(COPY.create.emojiLabel), '☀️')
    await user.press(screen.getByRole('button', { name: COPY.create.submit }))

    expect(service.createAlbum).toHaveBeenCalledWith({
      label: 'Weekends',
      emoji: '☀️',
      coverUri: undefined,
    })
    expect(mockReplace).toHaveBeenCalledWith('/(app)/memories/albums/album-9')
  })
})

describe('M03-S06 Album Detail', () => {
  it('loads a real album and removes membership through the provider', async () => {
    mockKey = 'album-1'
    const album = {
      id: 'album-1', key: 'trips', label: 'Trips', emoji: '✈️', count: 1,
    }
    const memory = {
      id: 'memory-1', title: 'Mountain sunrise', date: '2026-10-12',
      tags: ['Trips'], favorite: false,
    }
    service.getAlbum.mockResolvedValueOnce({ ok: true, value: album })
    service.listAlbumMemories.mockResolvedValueOnce({ ok: true, value: [memory] })
    service.removeFromAlbum.mockResolvedValueOnce({ ok: true, value: undefined })
    const user = userEvent.setup()

    await renderScreen(<AlbumDetailScreen />)
    await user.press(await screen.findByRole('button', { name: COPY.detail.remove }))

    expect(service.removeFromAlbum).toHaveBeenCalledWith({
      albumId: album.id,
      memoryId: memory.id,
    })
    expect(await screen.findByText(COPY.detail.empty)).toBeTruthy()
  })

  it('titles the hero with the album and its count', async () => {
    const trips = SAMPLE_ALBUMS.find((a) => a.key === 'Trips')!

    await renderScreen(<AlbumDetailScreen />)

    expect(screen.getByTestId(`album-hero-${trips.key}`)).toBeTruthy()
    expect(
      screen.getByText(COPY.detail.subtitle(trips.sampleCount, SAMPLE_HOME.coupleName)),
    ).toBeTruthy()
  })

  it('lists the memories carrying the album tag, and nothing else', async () => {
    const trips = SAMPLE_ALBUMS.find((a) => a.key === 'Trips')!
    const inside = memoriesInAlbum(trips)

    await renderScreen(<AlbumDetailScreen />)

    expect(inside.length).toBeGreaterThan(0)

    for (const memory of inside) {
      expect(screen.getByLabelText(memory.title)).toBeTruthy()
    }

    // A memory tagged only `Birthdays` has no business in Trips.
    expect(screen.queryByLabelText('Twenty-nine, and still terrible at blowing out candles.')).toBeNull()
  })

  it('derives Favorites from the flag rather than a tag', async () => {
    mockKey = 'favorites'

    await renderScreen(<AlbumDetailScreen />)

    const favorites = SAMPLE_ALBUMS.find((a) => a.key === 'favorites')!

    for (const memory of memoriesInAlbum(favorites)) {
      expect(memory.favorite).toBe(true)
      expect(screen.getByLabelText(memory.title)).toBeTruthy()
    }
  })

  it('decodes an escaped key from the route', async () => {
    mockKey = 'Little%20Things'

    await renderScreen(<AlbumDetailScreen />)

    expect(screen.getByTestId('album-hero-Little Things')).toBeTruthy()
  })

  it('says so for an album that does not exist, and offers a way back', async () => {
    mockKey = 'not-an-album'

    const user = userEvent.setup()
    await renderScreen(<AlbumDetailScreen />)

    expect(screen.getByText(COPY.detail.missing)).toBeTruthy()

    await user.press(screen.getByRole('button', { name: COPY.detail.back }))
    expect(mockBack).toHaveBeenCalled()
  })
})
