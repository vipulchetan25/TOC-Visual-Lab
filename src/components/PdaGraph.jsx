import AutomataGraph from './AutomataGraph'
import { parseTransitions } from '../logic/pdaMachine'

const buildGraphEdges = (transitionsInput) => {
  const grouped = parseTransitions(transitionsInput).reduce((acc, transition) => {
    const key = `${transition.fromState}->${transition.toState}`

    if (!acc[key]) {
      acc[key] = {
        id: key,
        fromState: transition.fromState,
        toState: transition.toState,
        labels: [],
      }
    }

    acc[key].labels.push(transition.label)
    return acc
  }, {})

  return Object.values(grouped).map((edge) => ({
    ...edge,
    label: edge.labels.join(' | '),
  }))
}

function PdaGraph({
  statesInput,
  acceptStatesInput,
  transitionsInput,
  startState,
  currentState,
  activeEdgeKeys,
}) {
  let graphEdges = []

  try {
    graphEdges = buildGraphEdges(transitionsInput)
  } catch {
    graphEdges = []
  }

  return (
    <AutomataGraph
      statesInput={statesInput}
      acceptStatesInput={acceptStatesInput}
      startState={startState}
      activeStates={currentState ? [currentState] : []}
      activeEdgeKeys={activeEdgeKeys}
      graphEdges={graphEdges}
      helperText="Static PDA diagram with transition labels in input, stackTop -> stackAction form."
    />
  )
}

export default PdaGraph
