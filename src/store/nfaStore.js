import { create } from 'zustand'
import {
  buildMachine,
  formatStateSet,
  getStepResult,
  initializePaths,
} from '../logic/nfaMachine'

const defaultMachine = {
  statesInput: 'q0, q1, q2',
  alphabetInput: '0, 1',
  startState: 'q0',
  acceptStatesInput: 'q2',
  transitionsInput: 'q0,0=q0\nq0,1=q0,q1\nq1,1=q2\nq1,eps=q2',
}

export const useNfaStore = create((set, get) => ({
  ...defaultMachine,
  input: '',
  result: null,
  machineError: null,
  currentStates: [],
  currentIndex: 0,
  started: false,
  history: [],
  currentPathMap: {},
  activeEdgeKeys: [],
  setField: (field, value) =>
    set({
      [field]: value,
      result: null,
      machineError: null,
    }),
  initializeSimulation: () => {
    try {
      const state = get()
      const machine = buildMachine(state)
      const trimmedInput = state.input.trim()
      const initial = initializePaths(machine)
      const currentStates = [...initial.states].sort()

      set({
        input: trimmedInput,
        machineError: null,
        result: null,
        started: true,
        currentStates,
        currentIndex: 0,
        currentPathMap: initial.pathMap,
        activeEdgeKeys: initial.edgeKeys,
        history: [
          {
            step: 0,
            states: currentStates,
            symbol: null,
            transitions: initial.traversed,
            edgeKeys: initial.edgeKeys,
            paths: Object.values(initial.pathMap),
            detail: `Initialized with ${formatStateSet(initial.states)}.`,
          },
        ],
      })
    } catch (error) {
      set({
        machineError: error.message,
        started: false,
        currentStates: [],
        currentIndex: 0,
        history: [],
        result: null,
        currentPathMap: {},
        activeEdgeKeys: [],
      })
    }
  },
  stepSimulation: () => {
    try {
      const state = get()
      const machine = buildMachine(state)

      if (!state.started) {
        get().initializeSimulation()
        return
      }

      if (state.result) {
        return
      }

      const stepResult = getStepResult(
        machine,
        state.input,
        state.currentPathMap,
        state.currentIndex,
      )

      set((current) => ({
        machineError: null,
        currentStates: [...stepResult.nextStates].sort(),
        currentIndex: stepResult.nextIndex,
        result: stepResult.status,
        currentPathMap: stepResult.pathMap,
        activeEdgeKeys: stepResult.edgeKeys,
        history: [
          ...current.history,
          {
            step: current.history.length,
            states: [...stepResult.nextStates].sort(),
            symbol: stepResult.consumedSymbol,
            transitions: stepResult.transitionsTaken,
            edgeKeys: stepResult.edgeKeys,
            paths: stepResult.pathSummaries,
            detail: stepResult.detail,
          },
        ],
      }))
    } catch (error) {
      set({ machineError: error.message })
    }
  },
  simulate: () => {
    get().initializeSimulation()

    let guard = 0
    while (!get().result && get().started && guard < 1000) {
      get().stepSimulation()
      guard += 1
    }
  },
  resetSimulation: () =>
    set({
      result: null,
      machineError: null,
      currentStates: [],
      currentIndex: 0,
      started: false,
      history: [],
      currentPathMap: {},
      activeEdgeKeys: [],
    }),
}))
