import AutomataGraph from './AutomataGraph'

function DfaGraph(props) {
  const activeStates = props.currentState ? [props.currentState] : []

  return (
    <AutomataGraph
      statesInput={props.statesInput}
      acceptStatesInput={props.acceptStatesInput}
      transitionsInput={props.transitionsInput}
      startState={props.startState}
      activeStates={activeStates}
      helperText="Static DFA diagram with active-state highlighting."
    />
  )
}

export default DfaGraph
