import { create } from 'zustand'

import { memoriesService } from '@/services/memories'
import type { Memory } from '@/services/memories/types'

type MemoriesState = {
  memories: Memory[]
  hydrated: boolean
  hydrate: (memories: Memory[]) => void
  add: (memory: Memory) => void
  replace: (memory: Memory) => void
  updatePrivateNote: (id: string, note: string) => Promise<Memory | null>
  withdrawPrivateNote: (id: string) => Promise<Memory | null>
  remove: (id: string) => void
  reset: () => void
}

/** Durable shared memories restored during authenticated app bootstrap. */
export const useMemoriesStore = create<MemoriesState>((set) => ({
  memories: [],
  hydrated: false,
  hydrate: (memories) => set({ memories, hydrated: true }),
  add: (memory) => set((state) => ({ memories: [memory, ...state.memories] })),
  replace: (memory) =>
    set((state) => ({
      memories: state.memories.map((item) => (item.id === memory.id ? memory : item)),
    })),
  updatePrivateNote: async (id, note) => {
    const result = await memoriesService.updatePrivateNote({ id, note })
    if (!result.ok) return null
    set((state) => ({
      memories: state.memories.map((item) => (item.id === id ? result.value : item)),
    }))
    return result.value
  },
  withdrawPrivateNote: async (id) => {
    const result = await memoriesService.withdrawPrivateNote({ id })
    if (!result.ok) return null
    set((state) => ({
      memories: state.memories.map((item) => (item.id === id ? result.value : item)),
    }))
    return result.value
  },
  remove: (id) =>
    set((state) => ({ memories: state.memories.filter((memory) => memory.id !== id) })),
  reset: () => set({ memories: [], hydrated: false }),
}))
