import { create } from 'zustand'

import { isMockMode } from '@/config/env'
import {
  SAMPLE_CAPSULES,
  SAMPLE_LETTERS,
  SAMPLE_LIFETIME,
  SAMPLE_PLACES,
  SAMPLE_TRIP,
  SAMPLE_WATCH_ROOM,
  SAMPLE_YEAR_BOARD,
} from '@/sample/plans'
import { plansService } from '@/services/plans'
import type {
  BingoTileState,
  Capsule,
  CapsuleDraft,
  Letter,
  LetterDraft,
  PromiseCategory,
  ShareWindow,
  SharedPromise,
  Trip,
  TripDraft,
  WatchRoom,
  YearBoard,
  PlansSnapshot,
} from '@/services/plans/types'

/**
 * EVERYTHING THE "OUR PLANS" CLUSTER REMEMBERS.
 *
 * One store, for the same reason there is one service: these features read each
 * other. The hub counts sealed capsules and waiting letters; sealing a letter
 * has to change a number on a card the user has already seen. Seven stores would
 * have meant the hub subscribing to seven of them.
 *
 * Mutations are optimistically queued through `plansService`; API mode hydrates
 * from the couple-scoped backend document, while mock mode is seeded from the
 * design fixtures. `reset()` exists for tests.
 */

type PlansState = {
  trip: Trip
  yearBoard: YearBoard
  promises: SharedPromise[]
  lifetimeTarget: number
  capsules: Capsule[]
  letters: Letter[]
  watchRoom: WatchRoom | null

  /** Which day of the itinerary is selected. 1-based. */
  selectedDay: number

  /** Location sharing — the only feature here with a live/off state. */
  sharingWindow: ShareWindow | null
  minutesRemaining: number
  hydrated: boolean
  saving: boolean
  error: string | null
  hydrate: () => Promise<void>

  /* --- trips --- */
  selectDay: (number: number) => void
  toggleMomentSaved: (momentId: string) => void
  createTrip: (draft: TripDraft) => void
  /**
   * Replaces the trip wholesale with one the planner built.
   *
   * Separate from `createTrip`, which only carries a draft's answers onto the
   * existing sample trip. This one takes a finished `Trip` — days, moments,
   * costs and all — because the planner composed it and there is nothing left
   * to merge. `selectedDay` resets so the couple lands on day one of the plan
   * they just watched being written, not on whatever day they were reading
   * before.
   */
  setGeneratedTrip: (trip: Trip) => void
  /** The couple's own choice of cover photo, from `CoverPhotoField`. */
  setTripCover: (uri: string) => void

  /* --- year board --- */
  cycleTile: (tileId: string) => void

  /* --- lifetime --- */
  togglePromiseLived: (promiseId: string) => void
  addPromise: (input: { title: string; detail: string; category: PromiseCategory }) => void

  /* --- capsules --- */
  sealCapsule: (draft: CapsuleDraft) => Capsule
  openCapsule: (capsuleId: string) => 'opened' | 'not-due' | 'not-found'

  /* --- letters --- */
  sealLetter: (draft: LetterDraft) => Letter
  openLetter: (letterId: string) => void

  /* --- watch together --- */
  setWatchRoom: (room: WatchRoom | null) => void

  /* --- places --- */
  setSharingWindow: (window: ShareWindow | null) => void

  reset: () => void
}

/** The seed, rebuilt on every `reset()` so tests never share mutated arrays. */
const emptyTrip: Trip = {
  id: 'new-trip', title: 'Our next adventure', destination: '', dateRange: '', coverUri: null,
  nights: 1, travellers: 2, budgetBand: 'flexible', estimatedCost: 0, currency: '£',
  styles: [], days: [], momentsPlanned: 0, momentsTotal: 0,
}

const emptyYearBoard: YearBoard = {
  year: new Date().getUTCFullYear(), tiles: [], encouragement: '', daysRemaining: 0,
}

const seed = () => ({
  trip: structuredClone(isMockMode ? SAMPLE_TRIP : emptyTrip),
  yearBoard: structuredClone(isMockMode ? SAMPLE_YEAR_BOARD : emptyYearBoard),
  promises: structuredClone(isMockMode ? SAMPLE_LIFETIME.promises : []),
  lifetimeTarget: isMockMode ? SAMPLE_LIFETIME.target : 50,
  capsules: structuredClone(isMockMode ? SAMPLE_CAPSULES : []),
  letters: structuredClone(isMockMode ? SAMPLE_LETTERS : []),
  watchRoom: structuredClone(isMockMode ? SAMPLE_WATCH_ROOM : null),
  selectedDay: 1,
  sharingWindow: isMockMode ? SAMPLE_PLACES.activeWindow : null,
  minutesRemaining: isMockMode ? SAMPLE_PLACES.minutesRemaining : 0,
  hydrated: false,
  saving: false,
  error: null,
})

const snapshot = (state: PlansState): PlansSnapshot => ({
  trip: state.trip,
  yearBoard: state.yearBoard,
  promises: state.promises,
  lifetimeTarget: state.lifetimeTarget,
  capsules: state.capsules,
  letters: state.letters,
  watchRoom: state.watchRoom,
  sharingWindow: state.sharingWindow,
  minutesRemaining: state.minutesRemaining,
})

let saveQueue = Promise.resolve()
let saveRevision = 0
const queueSave = (get: () => PlansState) => {
  const revision = ++saveRevision
  saveQueue = saveQueue.then(async () => {
    const value = structuredClone(snapshot(get()))
    usePlansStore.setState({ saving: true, error: null })
    const result = await plansService.replace(value)
    if (revision !== saveRevision) return
    if (result.ok) {
      usePlansStore.setState({ ...result.value, saving: false, error: null })
    } else {
      usePlansStore.setState({ saving: false, error: 'Your plans could not be saved. Try again.' })
    }
  })
}

/**
 * A bingo tile cycles rather than toggles.
 *
 * The board draws three states, not two, and the middle one ("in progress", the
 * amber card) is the one the design spends its accent colour on. A checkbox
 * would have made it unreachable by tapping.
 */
const NEXT_TILE_STATE: Record<BingoTileState, BingoTileState> = {
  todo: 'in-progress',
  'in-progress': 'done',
  done: 'todo',
}

export const usePlansStore = create<PlansState>((set, get) => ({
  ...seed(),

  hydrate: async () => {
    const result = await plansService.get()
    if (!result.ok) {
      set({ hydrated: true, error: 'Your plans could not be loaded.' })
      return
    }
    set({ ...(result.value ?? seed()), selectedDay: 1, hydrated: true, error: null })
  },

  selectDay: (number) => set({ selectedDay: number }),

  toggleMomentSaved: (momentId) => {
    set((state) => ({
      trip: {
        ...state.trip,
        days: state.trip.days.map((day) => ({
          ...day,
          moments: day.moments.map((moment) =>
            moment.id === momentId ? { ...moment, saved: !moment.saved } : moment,
          ),
        })),
      },
    }))
    queueSave(get)
  },

  createTrip: (draft) => {
    set((state) => ({
      // The generated plan keeps the sample's days — there is no planner to run,
      // and inventing empty days would make "Create our plan" look broken. What
      // the draft genuinely decides is carried across.
      trip: {
        ...state.trip,
        destination: draft.destination,
        nights: draft.nights,
        budgetBand: draft.budgetBand,
        styles: draft.styles,
      },
      selectedDay: 1,
    }))
    queueSave(get)
  },

  setGeneratedTrip: (trip) => {
    set({ trip, selectedDay: 1 })
    queueSave(get)
  },

  setTripCover: (uri) => {
    set((state) => ({ trip: { ...state.trip, coverUri: uri } }))
    queueSave(get)
  },

  cycleTile: (tileId) => {
    set((state) => ({
      yearBoard: {
        ...state.yearBoard,
        tiles: state.yearBoard.tiles.map((tile) =>
          tile.id === tileId ? { ...tile, state: NEXT_TILE_STATE[tile.state] } : tile,
        ),
      },
    }))
    queueSave(get)
  },

  togglePromiseLived: (promiseId) => {
    set((state) => ({
      promises: state.promises.map((promise) =>
        promise.id === promiseId ? { ...promise, lived: !promise.lived } : promise,
      ),
    }))
    queueSave(get)
  },

  addPromise: ({ title, detail, category }) => {
    set((state) => ({
      promises: [
        ...state.promises,
        {
          id: `p-own-${state.promises.length + 1}`,
          category,
          title,
          detail,
          lived: false,
          linkLabel: null,
          tag: 'Ours',
        },
      ],
    }))
    queueSave(get)
  },

  sealCapsule: (draft) => {
    const capsule: Capsule = {
      id: `cap-${get().capsules.length + 1}`,
      title: 'A capsule for us',
      createdAt: new Date().toISOString().slice(0, 10),
      opensAt: draft.opensAt,
      sealedBy: 'both',
      sealNote: draft.sealNote.trim() || null,
      contents: Object.fromEntries(draft.kinds.map((kind) => [kind, 1])),
      vaultCode: `TOT-${draft.opensAt.slice(0, 4)}-CS`,
      opened: false,
    }

    set((state) => ({ capsules: [capsule, ...state.capsules] }))
    queueSave(get)

    return capsule
  },

  openCapsule: (capsuleId) => {
    const capsule = get().capsules.find((item) => item.id === capsuleId)
    if (!capsule) return 'not-found'
    if (capsule.opened) return 'opened'

    const today = new Date().toISOString().slice(0, 10)
    if (capsule.opensAt > today) return 'not-due'

    set((state) => ({
      capsules: state.capsules.map((item) =>
        item.id === capsuleId ? { ...item, opened: true } : item,
      ),
    }))
    queueSave(get)
    return 'opened'
  },

  sealLetter: (draft) => {
    const letters = get().letters
    const letter: Letter = {
      id: `l-${String(letters.length + 1).padStart(3, '0')}`,
      number: Math.max(...letters.map((l) => l.number)) + 1,
      title: draft.title.trim(),
      from: 'me',
      to: draft.to,
      writtenAt: new Date().toISOString().slice(0, 10),
      opensAt: draft.opensAt ?? new Date().toISOString().slice(0, 10),
      // A letter with no date is readable the moment it is written, so it is
      // `ready`, not `sealed`. "Whenever they wish" is a choice not to seal.
      state: draft.opensAt ? 'sealed' : 'ready',
      teaser: draft.body.trim().slice(0, 120),
      body: draft.body,
      writtenIn: null,
      photoUri: null,
      photoCaption: null,
    }

    set({ letters: [letter, ...letters] })
    queueSave(get)

    return letter
  },

  openLetter: (letterId) => {
    set((state) => ({
      letters: state.letters.map((letter) =>
        letter.id === letterId ? { ...letter, state: 'opened' } : letter,
      ),
    }))
    queueSave(get)
  },

  setWatchRoom: (watchRoom) => {
    set({ watchRoom })
    queueSave(get)
  },

  setSharingWindow: (window) => {
    set({
      sharingWindow: window,
      minutesRemaining: window === '1h' ? 60 : window === 'tonight' ? 480 : 0,
    })
    queueSave(get)
  },

  reset: () => set({ ...seed() }),
}))

/* ------------------------------------------------------------------ *
 * DERIVED READS
 *
 * Selectors rather than stored counts. Every one of these is a fact ABOUT the
 * state, so storing it would mean two places that can disagree — and the hub is
 * where they would visibly disagree first.
 * ------------------------------------------------------------------ */

/**
 * Spots the couple has actually SAVED — not every moment in the plan.
 *
 * `ItineraryMoment.saved` is a real flag with a real control behind it (the
 * "Save" / "Saved to Plans" toggle on `MomentCard`). Counting `moments.length`
 * instead made the hub and the Home card both announce "3 saved spots" over a
 * trip where nothing had been saved, which is the app telling the couple they
 * did something they did not do.
 *
 * A shared selector rather than the same reduce written twice — that duplication
 * is how the two screens disagreed in the first place.
 */
export const selectSavedSpots = (state: PlansState) =>
  state.trip.days.reduce(
    (count, day) => count + day.moments.filter((moment) => moment.saved).length,
    0,
  )

/** Days that have anything planned in them at all. */
export const selectPlannedDays = (state: PlansState) =>
  state.trip.days.filter((day) => day.moments.length > 0).length

/** Every moment in the plan, saved or not — what "is there a plan" means. */
export const selectPlannedMoments = (state: PlansState) =>
  state.trip.days.reduce((count, day) => count + day.moments.length, 0)

export const selectTilesStamped = (state: PlansState) =>
  state.yearBoard.tiles.filter((tile) => tile.state === 'done').length

export const selectTilesInProgress = (state: PlansState) =>
  state.yearBoard.tiles.filter((tile) => tile.state === 'in-progress').length

export const selectPromisesLived = (state: PlansState) =>
  state.promises.filter((promise) => promise.lived).length

export const selectSealedCapsules = (state: PlansState) =>
  state.capsules.filter((capsule) => !capsule.opened).length

/** Letters addressed to the user that they have not read yet. */
export const selectWaitingLetters = (state: PlansState) =>
  state.letters.filter((letter) => letter.to === 'me' && letter.state !== 'opened').length
