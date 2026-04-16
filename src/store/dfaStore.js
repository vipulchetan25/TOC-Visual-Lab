import { create } from 'zustand'

const defaultMachine = {
  statesInput: 'q0, q1',
  startState: 'q0',
  acceptStatesInput: 'q0',
  transitionsInput: 'q0,0=q0\nq0,1=q1\nq1,0=q1\nq1,1=q0',
}

const parseList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const parseTransitions = (transitionsInput) => {
  const transitions = {}
  const lines = transitionsInput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const normalized = line.replace('->', '=')
    const [left, toState] = normalized.split('=').map((part) => part?.trim())

    if (!left || !toState) {
      throw new Error(`Invalid transition format: "${line}"`)
    }

    const [fromState, symbol] = left.split(',').map((part) => part?.trim())

    if (!fromState || !symbol) {
      throw new Error(`Invalid transition format: "${line}"`)
    }

    if (!transitions[fromState]) {
      transitions[fromState] = {}
    }

    transitions[fromState][symbol] = toState
  }

  return transitions
}

const buildMachine = ({ statesInput, startState, acceptStatesInput, transitionsInput }) => {
  const states = parseList(statesInput)
  const acceptStates = new Set(parseList(acceptStatesInput))
  const transitions = parseTransitions(transitionsInput)
  const trimmedStartState = startState.trim()

  if (states.length === 0) {
    throw new Error('Add at least one state.')
  }

  if (!trimmedStartState) {
    throw new Error('Provide a start state.')
  }

  if (!states.includes(trimmedStartState)) {
    throw new Error('Start state must exist in the states list.')
  }

  for (const acceptState of acceptStates) {
    if (!states.includes(acceptState)) {
      throw new Error(`Accept state "${acceptState}" is not in the states list.`)
    }
  }

  for (const [fromState, symbolMap] of Object.entries(transitions)) {
    if (!states.includes(fromState)) {
      throw new Error(`Transition starts from unknown state "${fromState}".`)
    }

    for (const [symbol, toState] of Object.entries(symbolMap)) {
      if (!symbol) {
        throw new Error(`Transition from "${fromState}" is missing a symbol.`)
      }

      if (!states.includes(toState)) {
        throw new Error(`Transition "${fromState},${symbol}" points to unknown state "${toState}".`)
      }
    }
  }

  return {
    states,
    startState: trimmedStartState,
    acceptStates,
    transitions,
  }
}

const getStepResult = (machine, input, currentState, currentIndex) => {
  if (currentIndex >= input.length) {
    return {
      status: machine.acceptStates.has(currentState) ? 'Accepted' : 'Rejected',
      nextState: currentState,
      nextIndex: currentIndex,
      consumedSymbol: null,
      reason: 'Input fully processed.',
    }
  }

  const symbol = input[currentIndex]
  const nextState = machine.transitions[currentState]?.[symbol]

  if (!nextState) {
    return {
      status: 'Rejected',
      nextState: currentState,
      nextIndex: currentIndex,
      consumedSymbol: symbol,
      reason: `No transition defined for (${currentState}, ${symbol}).`,
    }
  }

  const nextIndex = currentIndex + 1
  const status =
    nextIndex === input.length
      ? machine.acceptStates.has(nextState)
        ? 'Accepted'
        : 'Rejected'
      : null

  return {
    status,
    nextState,
    nextIndex,
    consumedSymbol: symbol,
    reason:
      nextIndex === input.length
        ? 'Input fully processed.'
        : `Read "${symbol}" and moved to ${nextState}.`,
  }
}

export const useDfaStore = create((set, get) => ({
  ...defaultMachine,
  input: '',
  result: null,
  machineError: null,
  currentState: null,
  currentIndex: 0,
  started: false,
  history: [],
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

      set({
        input: trimmedInput,
        machineError: null,
        result: null,
        started: true,
        currentState: machine.startState,
        currentIndex: 0,
        history: [
          {
            step: 0,
            state: machine.startState,
            symbol: null,
            detail: 'Simulation initialized.',
          },
        ],
      })
    } catch (error) {
      set({
        machineError: error.message,
        started: false,
        currentState: null,
        currentIndex: 0,
        history: [],
        result: null,
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
      )

      set((current) => ({
        machineError: null,
        currentState: stepResult.nextState,
        currentIndex: stepResult.nextIndex,
        result: stepResult.status,
        history: [
          ...current.history,
          {
            step: current.history.length,
            state: stepResult.nextState,
            symbol: stepResult.consumedSymbol,
            detail: stepResult.reason,
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
      started: false,
      history: [],
    }),
}))
