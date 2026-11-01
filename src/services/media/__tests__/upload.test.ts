import { Platform } from 'react-native'
import { request } from '@/services/http/client'
import { ensureRemoteUri, uploadMedia } from '@/services/media'

jest.mock('react-native', () => ({ Platform: { OS: 'web' } }))
jest.mock('@/services/http/client', () => ({ request: jest.fn() }))
jest.mock('@/services/media/expoMedia', () => ({ createExpoMediaService: () => ({}) }))
jest.mock('@/state/preferencesStore', () => ({ usePreferencesStore: { getState: () => ({ uploadQuality: 'original' }) } }))

const uploaded = { url: 'https://api.example.test/media/image.png?signature=signed-access', contentType: 'image/png', bytes: 3 }
const append = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  Object.assign(Platform, { OS: 'web' })
  jest.mocked(request).mockResolvedValue({ data: uploaded, meta: {} })
  jest.spyOn(global, 'FormData').mockImplementation(() => ({ append }) as unknown as FormData)
})

afterEach(() => jest.restoreAllMocks())

it('uploads a real browser blob and preserves the backend signed URL', async () => {
  const file = { type: 'image/png' } as Blob
  jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, blob: async () => file } as Response)
  expect(await uploadMedia('blob:https://example.test/picked-file')).toEqual(uploaded)
  expect(append).toHaveBeenCalledWith('file', file, 'upload')
  expect(request).toHaveBeenCalledWith('/media', expect.objectContaining({ method: 'POST', timeoutMs: 120_000 }))
})

it('does not upload or replace an existing signed backend URL', async () => {
  expect(await ensureRemoteUri(uploaded.url)).toBe(uploaded.url)
  expect(request).not.toHaveBeenCalled()
})

it('does not send an unreadable browser file', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response)
  await expect(uploadMedia('blob:https://example.test/missing-file')).rejects.toThrow('could not be read')
  expect(request).not.toHaveBeenCalled()
})

it('keeps the React Native file-part shape on native platforms', async () => {
  Object.assign(Platform, { OS: 'ios' })
  await uploadMedia('file:///photo.jpg')
  expect(append).toHaveBeenCalledWith('file', { uri: 'file:///photo.jpg', name: 'upload.jpg', type: 'image/jpeg' })
})