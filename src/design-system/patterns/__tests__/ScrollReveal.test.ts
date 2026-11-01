import { intersectsViewport, observeWebReveal } from '@/design-system/patterns/ScrollReveal'

describe('scroll reveal visibility', () => {
  const viewport = { x: 0, y: 80, width: 390, height: 600 }

  it('reveals intersecting content but not content below the scroll viewport', () => {
    expect(intersectsViewport({ x: 10, y: 200, width: 350, height: 120 }, viewport)).toBe(true)
    expect(intersectsViewport({ x: 10, y: 680, width: 350, height: 120 }, viewport)).toBe(false)
  })

  it('allows tall content and excludes offscreen or unmeasured content', () => {
    expect(intersectsViewport({ x: 0, y: 0, width: 390, height: 3000 }, viewport)).toBe(true)
    expect(intersectsViewport({ x: 400, y: 100, width: 100, height: 100 }, viewport)).toBe(false)
    expect(intersectsViewport({ x: 0, y: 0, width: 0, height: 0 }, viewport)).toBe(false)
    expect(intersectsViewport({ x: 0, y: NaN, width: 100, height: 100 }, viewport)).toBe(false)
  })

  it('never leaves content hidden when IntersectionObserver is unavailable', () => {
    const original = globalThis.IntersectionObserver
    Object.defineProperty(globalThis, 'IntersectionObserver', { value: undefined, configurable: true, writable: true })
    try {
      const reveal = jest.fn()
      const stop = observeWebReveal({} as Element, reveal)
      expect(reveal).toHaveBeenCalledTimes(1)
      expect(() => stop()).not.toThrow()
    } finally {
      Object.defineProperty(globalThis, 'IntersectionObserver', { value: original, configurable: true, writable: true })
    }
  })

  it('disconnects after intersection and on cleanup', () => {
    const original = globalThis.IntersectionObserver
    const disconnect = jest.fn()
    const observe = jest.fn()
    let callback: IntersectionObserverCallback | undefined
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true, writable: true,
      value: class {
        constructor(next: IntersectionObserverCallback) { callback = next }
        observe = observe
        disconnect = disconnect
      },
    })
    try {
      const reveal = jest.fn()
      const element = {} as Element
      const stop = observeWebReveal(element, reveal)
      expect(observe).toHaveBeenCalledWith(element)
      callback?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
      expect(reveal).not.toHaveBeenCalled()
      callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
      expect(reveal).toHaveBeenCalledTimes(1)
      expect(disconnect).toHaveBeenCalled()
      stop()
      expect(disconnect).toHaveBeenCalledTimes(2)
    } finally {
      Object.defineProperty(globalThis, 'IntersectionObserver', { value: original, configurable: true, writable: true })
    }
  })

  it('fails visible when observer setup throws', () => {
    const original = globalThis.IntersectionObserver
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true, writable: true,
      value: class { constructor() { throw new Error('Unsupported observer') } },
    })
    try {
      const reveal = jest.fn()
      observeWebReveal({} as Element, reveal)()
      expect(reveal).toHaveBeenCalledTimes(1)
    } finally {
      Object.defineProperty(globalThis, 'IntersectionObserver', { value: original, configurable: true, writable: true })
    }
  })
})