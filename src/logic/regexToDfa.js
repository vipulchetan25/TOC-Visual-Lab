const EPSILON = 'eps'
const OPERATORS = new Set(['|', '.', '*'])

const isSymbol = (char) => !OPERATORS.has(char) && char !== '(' && char !== ')'

const addConcatenationOperators = (regex) => {
  const tokens = regex.split('')
  const output = []

  for (let index = 0; index < tokens.length; index += 1) {
    const current = tokens[index]
    const next = tokens[index + 1]
    output.push(current)

    if (!next) {
      continue
    }

    const currentEndsTerm = isSymbol(current) || current === ')' || current === '*'
    const nextStartsTerm = isSymbol(next) || next === '('

    if (currentEndsTerm && nextStartsTerm) {
      output.push('.')
    }
  }

  return output.join('')
}

const precedence = (operator) => {
  if (operator === '*') return 3
  if (operator === '.') return 2
  if (operator === '|') return 1
  return 0
}

export const regexToPostfix = (regexInput) => {
  const regex = regexInput.replace(/\s+/g, '')

  if (!regex) {
    throw new Error('Enter a regex to convert.')
  }

  const explicit = addConcatenationOperators(regex)
  const output = []
  const stack = []

  for (const token of explicit) {
    if (isSymbol(token)) {
      output.push(token)
      continue
    }

    if (token === '(') {
      stack.push(token)
      continue
    }

    if (token === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        output.push(stack.pop())
      }

      if (stack.pop() !== '(') {
        throw new Error('Mismatched parentheses in regex.')
      }
      continue
    }

    while (
      stack.length > 0 &&
      stack[stack.length - 1] !== '(' &&
      precedence(stack[stack.length - 1]) >= precedence(token)
    ) {
      output.push(stack.pop())
    }

    stack.push(token)
  }

  while (stack.length > 0) {
    const operator = stack.pop()
    if (operator === '(' || operator === ')') {
      throw new Error('Mismatched parentheses in regex.')
    }
    output.push(operator)
  }

  return output.join('')
}

const createStateFactory = () => {
  let id = 0
  return () => `n${id++}`
}

const appendTransition = (transitions, from, symbol, to) => {
  transitions.push({ from, symbol, to })
}

export const postfixToNfa = (postfix) => {
  const stack = []
  const nextState = createStateFactory()

  for (const token of postfix) {
    if (isSymbol(token)) {
      const start = nextState()
      const accept = nextState()
      const transitions = []
      appendTransition(transitions, start, token, accept)
      stack.push({ start, accept, transitions })
      continue
    }

    if (token === '.') {
      const right = stack.pop()
      const left = stack.pop()

      if (!left || !right) {
        throw new Error('Invalid concatenation in regex.')
      }

      const transitions = [...left.transitions, ...right.transitions]
      appendTransition(transitions, left.accept, EPSILON, right.start)
      stack.push({
        start: left.start,
        accept: right.accept,
        transitions,
      })
      continue
    }

    if (token === '|') {
      const right = stack.pop()
      const left = stack.pop()

      if (!left || !right) {
        throw new Error('Invalid union in regex.')
      }

      const start = nextState()
      const accept = nextState()
      const transitions = [...left.transitions, ...right.transitions]
      appendTransition(transitions, start, EPSILON, left.start)
      appendTransition(transitions, start, EPSILON, right.start)
      appendTransition(transitions, left.accept, EPSILON, accept)
      appendTransition(transitions, right.accept, EPSILON, accept)
      stack.push({ start, accept, transitions })
      continue
    }

    if (token === '*') {
      const fragment = stack.pop()

      if (!fragment) {
        throw new Error('Invalid Kleene star in regex.')
      }

      const start = nextState()
      const accept = nextState()
      const transitions = [...fragment.transitions]
      appendTransition(transitions, start, EPSILON, fragment.start)
      appendTransition(transitions, start, EPSILON, accept)
      appendTransition(transitions, fragment.accept, EPSILON, fragment.start)
      appendTransition(transitions, fragment.accept, EPSILON, accept)
      stack.push({ start, accept, transitions })
    }
  }

  if (stack.length !== 1) {
    throw new Error('Invalid regex expression.')
  }

  return stack[0]
}

const buildTransitionMap = (transitions) =>
  transitions.reduce((acc, transition) => {
    acc[transition.from] ??= {}
    acc[transition.from][transition.symbol] ??= new Set()
    acc[transition.from][transition.symbol].add(transition.to)
    return acc
  }, {})

const epsilonClosure = (transitionMap, states) => {
  const closure = new Set(states)
  const stack = [...states]

  while (stack.length > 0) {
    const state = stack.pop()
    const epsilonTargets = transitionMap[state]?.[EPSILON] ?? new Set()

    for (const nextState of epsilonTargets) {
      if (!closure.has(nextState)) {
        closure.add(nextState)
        stack.push(nextState)
      }
    }
  }

  return closure
}

const move = (transitionMap, states, symbol) => {
  const nextStates = new Set()

  for (const state of states) {
    const targets = transitionMap[state]?.[symbol] ?? new Set()
    for (const target of targets) {
      nextStates.add(target)
    }
  }

  return nextStates
}

const formatStateSetKey = (states) => [...states].sort().join(',')

const normalizeDfaTransitions = (transitions) => {
  const seen = new Map()

  for (const transition of transitions) {
    const key = `${transition.from}|${transition.symbol}`
    seen.set(key, {
      from: transition.from,
      symbol: transition.symbol,
      to: transition.to,
    })
  }

  return [...seen.values()].sort((left, right) => {
    if (left.from !== right.from) return left.from.localeCompare(right.from)
    if (left.to !== right.to) return left.to.localeCompare(right.to)
    return left.symbol.localeCompare(right.symbol)
  })
}

const getReachableStates = (dfa) => {
  const reachable = new Set([dfa.startState])
  const queue = [dfa.startState]

  while (queue.length > 0) {
    const state = queue.shift()

    for (const transition of dfa.transitions) {
      if (transition.from === state && !reachable.has(transition.to)) {
        reachable.add(transition.to)
        queue.push(transition.to)
      }
    }
  }

  return reachable
}

const minimizeDfa = (dfa) => {
  const transitions = normalizeDfaTransitions(dfa.transitions)
  const reachable = getReachableStates({ ...dfa, transitions })
  const reachableStates = dfa.states.filter((state) => reachable.has(state))
  const reachableAcceptStates = dfa.acceptStates.filter((state) => reachable.has(state))
  const acceptSet = new Set(reachableAcceptStates)
  const alphabet = [...dfa.alphabet]
  const transitionMap = transitions.reduce((acc, transition) => {
    if (!reachable.has(transition.from) || !reachable.has(transition.to)) {
      return acc
    }

    acc[transition.from] ??= {}
    acc[transition.from][transition.symbol] = transition.to
    return acc
  }, {})

  let partitions = []
  const acceptingGroup = reachableStates.filter((state) => acceptSet.has(state))
  const rejectingGroup = reachableStates.filter((state) => !acceptSet.has(state))

  if (acceptingGroup.length > 0) {
    partitions.push(acceptingGroup)
  }
  if (rejectingGroup.length > 0) {
    partitions.push(rejectingGroup)
  }

  let changed = true

  while (changed) {
    changed = false
    const nextPartitions = []

    for (const group of partitions) {
      const signatures = new Map()

      for (const state of group) {
        const signature = alphabet
          .map((symbol) => {
            const target = transitionMap[state]?.[symbol] ?? null
            const targetPartitionIndex = partitions.findIndex((partition) =>
              partition.includes(target),
            )
            return `${symbol}:${targetPartitionIndex}`
          })
          .join('|')

        signatures.set(signature, [...(signatures.get(signature) ?? []), state])
      }

      if (signatures.size === 1) {
        nextPartitions.push(group)
        continue
      }

      changed = true
      nextPartitions.push(...signatures.values())
    }

    partitions = nextPartitions
  }

  const renamedStates = new Map()
  partitions.forEach((group, index) => {
    const name = `D${index}`
    group.forEach((state) => renamedStates.set(state, name))
  })

  const minimizedTransitions = normalizeDfaTransitions(
    transitions
      .filter((transition) => reachable.has(transition.from) && reachable.has(transition.to))
      .map((transition) => ({
        from: renamedStates.get(transition.from),
        symbol: transition.symbol,
        to: renamedStates.get(transition.to),
      })),
  )

  return {
    states: [...new Set(partitions.map((_, index) => `D${index}`))],
    startState: renamedStates.get(dfa.startState),
    acceptStates: [...new Set(reachableAcceptStates.map((state) => renamedStates.get(state)))].sort(),
    transitions: minimizedTransitions,
    alphabet,
  }
}

export const nfaToDfa = (nfa) => {
  const transitionMap = buildTransitionMap(nfa.transitions)
  const alphabet = [...new Set(nfa.transitions.map((transition) => transition.symbol).filter((symbol) => symbol !== EPSILON))].sort()
  const startClosure = epsilonClosure(transitionMap, new Set([nfa.start]))
  const startKey = formatStateSetKey(startClosure)
  const stateNameMap = new Map([[startKey, 'D0']])
  const queue = [startClosure]
  const dfaTransitions = []
  const acceptStates = new Set()
  let stateCounter = 1

  while (queue.length > 0) {
    const currentSet = queue.shift()
    const currentKey = formatStateSetKey(currentSet)
    const currentName = stateNameMap.get(currentKey)

    if (currentSet.has(nfa.accept)) {
      acceptStates.add(currentName)
    }

    for (const symbol of alphabet) {
      const moved = move(transitionMap, currentSet, symbol)
      if (moved.size === 0) {
        continue
      }

      const targetClosure = epsilonClosure(transitionMap, moved)
      const targetKey = formatStateSetKey(targetClosure)

      if (!stateNameMap.has(targetKey)) {
        stateNameMap.set(targetKey, `D${stateCounter++}`)
        queue.push(targetClosure)
      }

      dfaTransitions.push({
        from: currentName,
        symbol,
        to: stateNameMap.get(targetKey),
      })
    }
  }

  return {
    states: [...stateNameMap.values()],
    startState: 'D0',
    acceptStates: [...acceptStates],
    transitions: normalizeDfaTransitions(dfaTransitions),
    alphabet,
  }
}

export const convertRegexToDfa = (regex) => {
  const postfix = regexToPostfix(regex)
  const nfa = postfixToNfa(postfix)
  const dfa = minimizeDfa(nfaToDfa(nfa))

  return {
    regex: regex.replace(/\s+/g, ''),
    postfix,
    dfa,
  }
}
