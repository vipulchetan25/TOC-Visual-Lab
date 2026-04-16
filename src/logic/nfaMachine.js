const EPSILON = 'eps'
const EPSILON_ALIASES = new Set(['eps', 'epsilon', 'e', 'ε'])

export const normalizeSymbol = (symbol) => {
  const trimmed = symbol.trim()
  return EPSILON_ALIASES.has(trimmed.toLowerCase()) ? EPSILON : trimmed
}

export const parseList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const formatStateSet = (states) => {
  const items = [...states].sort()
  return items.length > 0 ? `{${items.join(', ')}}` : '{}'
}

export const parseTransitions = (transitionsInput) => {
  const transitions = {}
  const lines = transitionsInput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const normalized = line.replace('->', '=')
    const [left, right] = normalized.split('=').map((part) => part?.trim())

    if (!left || !right) {
      throw new Error(`Invalid transition format: "${line}"`)
    }

    const [fromState, rawSymbol] = left.split(',').map((part) => part?.trim())
    const symbol = normalizeSymbol(rawSymbol ?? '')
    const toStates = right
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)

    if (!fromState || !symbol || toStates.length === 0) {
      throw new Error(`Invalid transition format: "${line}"`)
    }

    transitions[fromState] ??= {}
    transitions[fromState][symbol] ??= new Set()

    for (const toState of toStates) {
      transitions[fromState][symbol].add(toState)
    }
  }

  return transitions
}

export const buildMachine = ({
  statesInput,
  alphabetInput,
  startState,
  acceptStatesInput,
  transitionsInput,
}) => {
  const states = parseList(statesInput)
  const alphabet = new Set(parseList(alphabetInput).map(normalizeSymbol))
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

    for (const [symbol, toStates] of Object.entries(symbolMap)) {
      if (symbol !== EPSILON && alphabet.size > 0 && !alphabet.has(symbol)) {
        throw new Error(`Transition symbol "${symbol}" is not in the alphabet.`)
      }

      for (const toState of toStates) {
        if (!states.includes(toState)) {
          throw new Error(`Transition "${fromState},${symbol}" points to unknown state "${toState}".`)
        }
      }
    }
  }

  return {
    states,
    alphabet,
    startState: trimmedStartState,
    acceptStates,
    transitions,
  }
}

const pathMapToEntries = (pathMap) =>
  Object.entries(pathMap).map(([state, path]) => ({ state, path }))

export const epsilonClosure = (machine, pathMap) => {
  const resolved = { ...pathMap }
  const stack = pathMapToEntries(pathMap)
  const traversed = []
  const edgeKeys = []

  while (stack.length > 0) {
    const entry = stack.pop()
    const epsilonTargets = machine.transitions[entry.state]?.[EPSILON] ?? new Set()

    for (const nextState of epsilonTargets) {
      traversed.push(`${entry.state} --eps--> ${nextState}`)
      edgeKeys.push(`${entry.state}->${nextState}`)

      if (!resolved[nextState]) {
        resolved[nextState] = `${entry.path} --eps--> ${nextState}`
        stack.push({ state: nextState, path: resolved[nextState] })
      }
    }
  }

  return {
    states: new Set(Object.keys(resolved)),
    pathMap: resolved,
    traversed,
    edgeKeys,
  }
}

export const initializePaths = (machine) => {
  const initial = {
    [machine.startState]: machine.startState,
  }

  return epsilonClosure(machine, initial)
}

export const getStepResult = (machine, input, currentPathMap, currentIndex) => {
  if (currentIndex >= input.length) {
    const currentStates = new Set(Object.keys(currentPathMap))
    const accepted = [...currentStates].some((state) => machine.acceptStates.has(state))

    return {
      status: accepted ? 'Accepted' : 'Rejected',
      nextStates: currentStates,
      nextIndex: currentIndex,
      consumedSymbol: null,
      transitionsTaken: [],
      edgeKeys: [],
      pathMap: currentPathMap,
      pathSummaries: Object.values(currentPathMap),
      detail: accepted
        ? `Input fully processed. Accepting set: ${formatStateSet(currentStates)}`
        : `Input fully processed. No accepting state in ${formatStateSet(currentStates)}.`,
    }
  }

  const symbol = normalizeSymbol(input[currentIndex])
  const nextPathMap = {}
  const transitionsTaken = []
  const edgeKeys = []

  for (const [state, path] of Object.entries(currentPathMap)) {
    const nextStates = machine.transitions[state]?.[symbol] ?? new Set()

    for (const nextState of nextStates) {
      transitionsTaken.push(`${state} --${symbol}--> ${nextState}`)
      edgeKeys.push(`${state}->${nextState}`)

      if (!nextPathMap[nextState]) {
        nextPathMap[nextState] = `${path} --${symbol}--> ${nextState}`
      }
    }
  }

  if (Object.keys(nextPathMap).length === 0) {
    return {
      status: 'Rejected',
      nextStates: new Set(),
      nextIndex: currentIndex + 1,
      consumedSymbol: symbol,
      transitionsTaken: [],
      edgeKeys: [],
      pathMap: {},
      pathSummaries: [],
      detail: `No transition found for symbol "${symbol}" from ${formatStateSet(
        new Set(Object.keys(currentPathMap)),
      )}.`,
    }
  }

  const closure = epsilonClosure(machine, nextPathMap)
  const nextIndex = currentIndex + 1
  const status =
    nextIndex === input.length
      ? [...closure.states].some((state) => machine.acceptStates.has(state))
        ? 'Accepted'
        : 'Rejected'
      : null

  return {
    status,
    nextStates: closure.states,
    nextIndex,
    consumedSymbol: symbol,
    transitionsTaken: [...transitionsTaken, ...closure.traversed],
    edgeKeys: [...edgeKeys, ...closure.edgeKeys],
    pathMap: closure.pathMap,
    pathSummaries: Object.values(closure.pathMap),
    detail: `After reading "${symbol}", current set is ${formatStateSet(closure.states)}.`,
  }
}
