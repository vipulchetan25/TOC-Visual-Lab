import AutomataGraph from './AutomataGraph'

function NfaGraph(props) {
  return (
    <AutomataGraph
      statesInput={props.statesInput}
      acceptStatesInput={props.acceptStatesInput}
      transitionsInput={props.transitionsInput}
      startState={props.startState}
      activeStates={props.currentStates}
      activeEdgeKeys={props.activeEdgeKeys}
      helperText="Static NFA diagram with branching edges, active branches, and multiple active states."
    />
  )
}

export default NfaGraph
