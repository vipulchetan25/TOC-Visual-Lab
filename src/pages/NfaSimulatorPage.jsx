import { Link } from 'react-router-dom'
import NfaGraph from '../components/NfaGraph'
import { useNfaStore } from '../store/nfaStore'

function NfaSimulatorPage() {
  const statesInput = useNfaStore((state) => state.statesInput)
  const alphabetInput = useNfaStore((state) => state.alphabetInput)
  const startState = useNfaStore((state) => state.startState)
  const acceptStatesInput = useNfaStore((state) => state.acceptStatesInput)
  const transitionsInput = useNfaStore((state) => state.transitionsInput)
  const input = useNfaStore((state) => state.input)
  const result = useNfaStore((state) => state.result)
  const machineError = useNfaStore((state) => state.machineError)
  const currentStates = useNfaStore((state) => state.currentStates)
  const currentIndex = useNfaStore((state) => state.currentIndex)
  const history = useNfaStore((state) => state.history)
  const started = useNfaStore((state) => state.started)
  const activeEdgeKeys = useNfaStore((state) => state.activeEdgeKeys)
  const setField = useNfaStore((state) => state.setField)
  const stepSimulation = useNfaStore((state) => state.stepSimulation)
  const simulate = useNfaStore((state) => state.simulate)
  const resetSimulation = useNfaStore((state) => state.resetSimulation)

  const processedInput = input.slice(0, currentIndex)
  const remainingInput = input.slice(currentIndex)
  const currentStateSetLabel =
    currentStates.length > 0 ? `{${currentStates.join(', ')}}` : '{}'

  return (
    <section className="page-card simulator-card">
      <div className="page-copy">
        <p className="eyebrow">NFA Simulator</p>
        <h1>Explore branching computation paths.</h1>
        <p className="lead">
          Define an NFA with optional epsilon transitions and inspect the active
          state set one step at a time.
        </p>
      </div>

      <div className="simulator-panel">
        <NfaGraph
          statesInput={statesInput}
          acceptStatesInput={acceptStatesInput}
          transitionsInput={transitionsInput}
          startState={startState}
          currentStates={currentStates}
          activeEdgeKeys={activeEdgeKeys}
        />

        <div className="form-grid triple-grid">
          <div>
            <label className="field-label" htmlFor="nfa-states">
              States
            </label>
            <input
              id="nfa-states"
              className="text-input"
              type="text"
              value={statesInput}
              onChange={(event) => setField('statesInput', event.target.value)}
              placeholder="q0, q1, q2"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="nfa-alphabet">
              Alphabet
            </label>
            <input
              id="nfa-alphabet"
              className="text-input"
              type="text"
              value={alphabetInput}
              onChange={(event) => setField('alphabetInput', event.target.value)}
              placeholder="0, 1"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="nfa-start">
              Start state
            </label>
            <input
              id="nfa-start"
              className="text-input"
              type="text"
              value={startState}
              onChange={(event) => setField('startState', event.target.value)}
              placeholder="q0"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="nfa-accept">
            Accept states
          </label>
          <input
            id="nfa-accept"
            className="text-input"
            type="text"
            value={acceptStatesInput}
            onChange={(event) => setField('acceptStatesInput', event.target.value)}
            placeholder="q2"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="nfa-transitions">
            Transitions
          </label>
          <textarea
            id="nfa-transitions"
            className="text-area"
            value={transitionsInput}
            onChange={(event) => setField('transitionsInput', event.target.value)}
            placeholder={'q0,0=q0\nq0,1=q0,q1\nq1,eps=q2'}
            rows={7}
          />
          <p className="helper-text">
            Use `from,symbol=to1,to2`. Repeated lines and `eps` transitions are
            supported.
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor="nfa-input">
            Input string
          </label>
          <input
            id="nfa-input"
            className="text-input"
            type="text"
            value={input}
            onChange={(event) => setField('input', event.target.value)}
            placeholder="Enter a string like 101"
          />
        </div>

        <div className="button-row">
          <button className="primary-button" type="button" onClick={simulate}>
            Simulate
          </button>
          <button className="secondary-button" type="button" onClick={stepSimulation}>
            Step
          </button>
          <button className="secondary-button" type="button" onClick={resetSimulation}>
            Reset
          </button>
        </div>

        {machineError ? (
          <div className="error-box">
            <span className="result-label">Machine error</span>
            <strong>{machineError}</strong>
          </div>
        ) : null}

        <div className="status-grid">
          <div className="result-box">
            <span className="result-label">Current state set</span>
            <strong className="set-display">{currentStateSetLabel}</strong>
            <div className="state-chip-row">
              {currentStates.length > 0 ? (
                currentStates.map((state) => (
                  <span className="state-chip active" key={state}>
                    {state}
                  </span>
                ))
              ) : (
                <strong>Not started</strong>
              )}
            </div>
          </div>

          <div className={`result-box ${result ? result.toLowerCase() : ''}`}>
            <span className="result-label">Result</span>
            <strong>{result ?? 'In progress / waiting'}</strong>
          </div>
        </div>

        <div className="result-box">
          <span className="result-label">String processing</span>
          <div className="input-track">
            <span className="processed">{processedInput || '\u00A0'}</span>
            <span className="remaining">{remainingInput || '\u00A0'}</span>
          </div>
          <small className="helper-text">
            {started
              ? `Processed ${currentIndex} of ${input.length} symbols.`
              : 'Use Step or Simulate to begin and compute epsilon closure from the start state.'}
          </small>
        </div>

        <div className="history-panel">
          <span className="result-label">Step trace</span>
          <div className="history-list">
            {history.length > 0 ? (
              history.map((entry) => (
                <div className="history-item" key={`${entry.step}-${entry.states.join('-')}`}>
                  <strong>Step {entry.step}</strong>
                  <span>
                    States: {entry.states.length > 0 ? `{${entry.states.join(', ')}}` : '{}'}
                  </span>
                  <span>Symbol: {entry.symbol ?? 'start / eps-closure'}</span>
                  <span>{entry.detail}</span>
                  {entry.transitions.length > 0 ? (
                    <div className="transition-list">
                      {entry.transitions.map((transition, index) => (
                        <span key={`${entry.step}-transition-${index}`}>{transition}</span>
                      ))}
                    </div>
                  ) : null}
                  {entry.paths.length > 0 ? (
                    <div className="path-list">
                      <strong>Possible paths</strong>
                      {entry.paths.map((path, index) => (
                        <span key={`${entry.step}-path-${index}`}>{path}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <span className="helper-text">No steps yet.</span>
            )}
          </div>
        </div>
      </div>

      <Link className="secondary-link" to="/">
        Back to Home
      </Link>
    </section>
  )
}

export default NfaSimulatorPage
