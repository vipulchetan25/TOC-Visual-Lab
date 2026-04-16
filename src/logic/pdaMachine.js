const EPSILON = 'eps'
const EPSILON_ALIASES = new Set(['eps', 'epsilon', 'e', 'ε'])

export const normalizeToken = (value) => {
  const trimmed = value.trim()
  return EPSILON_ALIASES.has(trimmed.toLowerCase()) ? EPSILON : trimmed
}

export const parseList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const formatStack = (stack) =>
  stack.length > 0 ? `[${stack.join(', ')}]` : '[]'

export const parseTransitions = (transitionsInput) => {
  const lines = transitionsInput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.map((line) => {
    const normalized = line.replace('->', '=')
    const [left, right] = normalized.split('=').map((part) => part?.trim())

    if (!left || !right) {
      throw new Error(`Invalid transition format: "${line}"`)
    }

    const leftParts = left.split(',').map((part) => part.trim())
    const rightParts = right.split(',').map((part) => part.trim())

    if (leftParts.length !== 3 || rightParts.length !== 2) {
      throw new Error(`Use format from,input,stackTop = to,stackOperation in "${line}"`)
    }

    const [fromState, rawInputSymbol, stackTop] = leftParts
    const [toState, rawStackOperation] = rightParts
    const inputSymbol = normalizeToken(rawInputSymbol)
    const stackOperation = normalizeToken(rawStackOperation)

    if (!fromState || !inputSymbol || !stackTop || !toState || !stackOperation) {
      throw new Error(`Transition is incomplete: "${line}"`)
    }

    return {
      id: `${fromState},${inputSymbol},${stackTop}=${toState},${stackOperation}`,
      fromState,
      inputSymbol,
      stackTop,
      toState,
      stackOperation,
      label: `${inputSymbol}, ${stackTop} -> ${stackOperation}`,
    }
  })
}

export const buildMachine = ({
  statesInput,
  alphabetInput,
  stackAlphabetInput,
  startState,
  acceptStatesInput,
  initialStackSymbol,
  acceptanceMode,
  transitionsInput,
}) => {
  const states = parseList(statesInput)
  const alphabet = new Set(parseList(alphabetInput).map(normalizeToken))
  const stackAlphabet = new Set(parseList(stackAlphabetInput))
  const acceptStates = new Set(parseList(acceptStatesInput))
  const transitions = parseTransitions(transitionsInput)
  const trimmedStartState = startState.trim()
  const trimmedInitialStackSymbol = initialStackSymbol.trim()

  if (states.length === 0) {
    throw new Error('Add at least one state.')
  }

  if (!trimmedStartState) {
    throw new Error('Provide a start state.')
  }

  if (!states.includes(trimmedStartState)) {
    throw new Error('Start state must exist in the states list.')
  }

  if (!trimmedInitialStackSymbol) {
    throw new Error('Provide an initial stack symbol.')
  }

  if (stackAlphabet.size > 0 && !stackAlphabet.has(trimmedInitialStackSymbol)) {
    throw new Error('Initial stack symbol must exist in the stack alphabet.')
  }

  for (const acceptState of acceptStates) {
    if (!states.includes(acceptState)) {
      throw new Error(`Accept state "${acceptState}" is not in the states list.`)
    }
  }

  const transitionMap = {}

  for (const transition of transitions) {
    if (!states.includes(transition.fromState)) {
      throw new Error(`Transition starts from unknown state "${transition.fromState}".`)
    }

    if (!states.includes(transition.toState)) {
      throw new Error(`Transition points to unknown state "${transition.toState}".`)
    }

    if (
      transition.inputSymbol !== EPSILON &&
      alphabet.size > 0 &&
      !alphabet.has(transition.inputSymbol)
    ) {
      throw new Error(`Transition symbol "${transition.inputSymbol}" is not in the alphabet.`)
    }

    if (stackAlphabet.size > 0 && !stackAlphabet.has(transition.stackTop)) {
      throw new Error(`Stack top "${transition.stackTop}" is not in the stack alphabet.`)
    }

    if (transition.stackOperation !== EPSILON) {
      for (const symbol of transition.stackOperation.split('')) {
        if (stackAlphabet.size > 0 && !stackAlphabet.has(symbol)) {
          throw new Error(
            `Stack operation "${transition.stackOperation}" uses unknown symbol "${symbol}".`,
          )
        }
      }
    }

    transitionMap[transition.fromState] ??= {}
    transitionMap[transition.fromState][transition.inputSymbol] ??= {}
    transitionMap[transition.fromState][transition.inputSymbol][transition.stackTop] = transition
  }

  return {
    states,
    alphabet,
    stackAlphabet,
    startState: trimmedStartState,
    acceptStates,
    initialStackSymbol: trimmedInitialStackSymbol,
    acceptanceMode,
    transitions,
    transitionMap,
  }
}

const findMatchingTransition = (machine, currentState, currentSymbol, stackTop) => {
  const stateTransitions = machine.transitionMap[currentState] ?? {}

  return stateTransitions[currentSymbol]?.[stackTop] ?? stateTransitions[EPSILON]?.[stackTop] ?? null
}

const applyStackOperation = (stack, stackOperation) => {
  const nextStack = [...stack]
  nextStack.pop()

  if (stackOperation !== EPSILON) {
    const symbols = stackOperation.split('')

    for (let index = symbols.length - 1; index >= 0; index -= 1) {
      nextStack.push(symbols[index])
    }
  }

  return nextStack
}

const describeStackOperation = (previousTop, nextStack, stackOperation) => {
  if (stackOperation === EPSILON) {
    return `Popped ${previousTop}.`
  }

  if (stackOperation.length === 1 && stackOperation === previousTop) {
    return `Kept ${previousTop} on top.`
  }

  if (stackOperation.endsWith(previousTop) && stackOperation.length > 1) {
    const pushed = stackOperation.slice(0, -1).split('').join(', ')
    return `Pushed ${pushed} above ${previousTop}.`
  }

  return `Replaced ${previousTop} with ${formatStack(nextStack)}.`
}

const getStackActionType = (previousTop, stackOperation) => {
  if (stackOperation === EPSILON) {
    return 'pop'
  }

  if (stackOperation.length === 1 && stackOperation === previousTop) {
    return 'replace'
  }

  if (stackOperation.endsWith(previousTop) && stackOperation.length > 1) {
    return 'push'
  }

  return 'replace'
}

const getAcceptanceStatus = (machine, currentState, inputIndex, inputLength, stack) => {
  if (inputIndex < inputLength) {
    return null
  }

  const acceptsByFinalState = machine.acceptStates.has(currentState)
  const acceptsByEmptyStack = stack.length === 0

  if (machine.acceptanceMode === 'empty-stack') {
    return acceptsByEmptyStack ? 'Accepted' : 'Rejected'
  }

  if (machine.acceptanceMode === 'either') {
    return acceptsByFinalState || acceptsByEmptyStack ? 'Accepted' : 'Rejected'
  }

  return acceptsByFinalState ? 'Accepted' : 'Rejected'
}

export const getStepResult = (machine, input, currentState, currentIndex, stack) => {
  const currentSymbol = input[currentIndex] ?? null
  const stackTop = stack[stack.length - 1] ?? null

  if (!stackTop) {
    return {
      status:
        getAcceptanceStatus(machine, currentState, currentIndex, input.length, stack) ??
        'Rejected',
      nextState: currentState,
      nextIndex: currentIndex,
      nextStack: stack,
      consumedSymbol: null,
      transitionLabel: null,
      activeEdgeKey: null,
      detail: 'Stack is empty, so no further PDA transition can be applied.',
      stackAction: 'No stack symbol available.',
      stackActionType: 'idle',
    }
  }

  const transition = findMatchingTransition(machine, currentState, currentSymbol, stackTop)

  if (!transition) {
    return {
      status:
        getAcceptanceStatus(machine, currentState, currentIndex, input.length, stack) ??
        'Rejected',
      nextState: currentState,
      nextIndex: currentIndex,
      nextStack: stack,
      consumedSymbol: null,
      transitionLabel: null,
      activeEdgeKey: null,
      detail: `No transition defined for (${currentState}, ${currentSymbol ?? EPSILON}, ${stackTop}).`,
      stackAction: 'No stack change.',
      stackActionType: 'idle',
    }
  }

  const consumesInput = transition.inputSymbol !== EPSILON
  const nextIndex = consumesInput ? currentIndex + 1 : currentIndex
  const nextStack = applyStackOperation(stack, transition.stackOperation)
  const status = getAcceptanceStatus(
    machine,
    transition.toState,
    nextIndex,
    input.length,
    nextStack,
  )

  return {
    status,
    nextState: transition.toState,
    nextIndex,
    nextStack,
    consumedSymbol: consumesInput ? currentSymbol : EPSILON,
    transitionLabel: transition.label,
    activeEdgeKey: `${transition.fromState}->${transition.toState}`,
    detail: `Moved from ${transition.fromState} to ${transition.toState} using ${transition.label}.`,
    stackAction: describeStackOperation(stackTop, nextStack, transition.stackOperation),
    stackActionType: getStackActionType(stackTop, transition.stackOperation),
  }
}
