import { create } from 'zustand'
import { buildMachine, formatStack, getStepResult } from '../logic/pdaMachine'

const defaultMachine = {
  statesInput: 'q0, q1',
  alphabetInput: '0, 1',
  stackAlphabetInput: 'Z, A',
  startState: 'q0',
  acceptStatesInput: 'q1',
  initialStackSymbol: 'Z',
  acceptanceMode: 'final-state',
  transitionsInput:
    'q0,0,Z = q0,AZ\nq0,0,A = q0,AA\nq0,1,A = q1,eps\nq1,1,A = q1,eps\nq1,eps,Z = q1,eps',
}

export const usePdaStore = create((set, get) => ({
  ...defaultMachine,
  input: '',
  result: null,
  machineError: null,
  currentState: null,
  currentIndex: 0,
  currentSymbol: null,
  stack: [],
  started: false,
  history: [],
  activeEdgeKeys: [],
  lastStackAction: null,
  stackActionType: 'idle',
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
      const initialStack = [machine.initialStackSymbol]

      set({
        input: trimmedInput,
        machineError: null,
        result: null,
        started: true,
        currentState: machine.startState,
        currentIndex: 0,
        currentSymbol: trimmedInput[0] ?? null,
        stack: initialStack,
        activeEdgeKeys: [],
        lastStackAction: 'Initialized stack.',
        stackActionType: 'push',
        history: [
          {
            step: 0,
            state: machine.startState,
            symbol: null,
            stack: initialStack,
            transition: null,
            stackAction: 'Initialized stack.',
            detail: `Started in ${machine.startState} with stack ${formatStack(initialStack)}.`,
          },
        ],
      })
    } catch (error) {
      set({
        machineError: error.message,
        result: null,
        started: false,
        currentState: null,
        currentIndex: 0,
        currentSymbol: null,
        stack: [],
        history: [],
        activeEdgeKeys: [],
        lastStackAction: null,
        stackActionType: 'idle',
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
        state.currentState,
        state.currentIndex,
        state.stack,
      )

      set((current) => ({
        machineError: null,
        currentState: stepResult.nextState,
        currentIndex: stepResult.nextIndex,
        currentSymbol: state.input[stepResult.nextIndex] ?? null,
        stack: stepResult.nextStack,
        result: stepResult.status,
        activeEdgeKeys: stepResult.activeEdgeKey ? [stepResult.activeEdgeKey] : [],
        lastStackAction: stepResult.stackAction,
        stackActionType: stepResult.stackActionType,
        history: [
          ...current.history,
          {
            step: current.history.length,
            state: stepResult.nextState,
            symbol: stepResult.consumedSymbol,
            stack: stepResult.nextStack,
            transition: stepResult.transitionLabel,
            stackAction: stepResult.stackAction,
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
      currentState: null,
      currentIndex: 0,
      currentSymbol: null,
      stack: [],
      started: false,
      history: [],
      activeEdgeKeys: [],
      lastStackAction: null,
      stackActionType: 'idle',
    }),
}))
