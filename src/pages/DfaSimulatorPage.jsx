import { Link } from 'react-router-dom'
import DfaGraph from '../components/DfaGraph'
import { useDfaStore } from '../store/dfaStore'

function DfaSimulatorPage() {
  const statesInput = useDfaStore((state) => state.statesInput)
  const startState = useDfaStore((state) => state.startState)
  const acceptStatesInput = useDfaStore((state) => state.acceptStatesInput)
  const transitionsInput = useDfaStore((state) => state.transitionsInput)
  const input = useDfaStore((state) => state.input)
  const result = useDfaStore((state) => state.result)
  const machineError = useDfaStore((state) => state.machineError)
  const currentState = useDfaStore((state) => state.currentState)
  const currentIndex = useDfaStore((state) => state.currentIndex)
  const history = useDfaStore((state) => state.history)
  const started = useDfaStore((state) => state.started)
  const setField = useDfaStore((state) => state.setField)
  const initializeSimulation = useDfaStore((state) => state.initializeSimulation)
  const stepSimulation = useDfaStore((state) => state.stepSimulation)
  const simulate = useDfaStore((state) => state.simulate)
  const resetSimulation = useDfaStore((state) => state.resetSimulation)

  const processedInput = input.slice(0, currentIndex)
  const remainingInput = input.slice(currentIndex)

  return (
    <section className="page-card simulator-card">
      <div className="page-copy">
        <p className="eyebrow">DFA Simulator</p>
        <h1>Run a simple deterministic finite automaton.</h1>
        <p className="lead">
          Define your own DFA, then run it step by step or all at once.
        </p>
      </div>

      <div className="simulator-panel">
        <DfaGraph
          statesInput={statesInput}
          acceptStatesInput={acceptStatesInput}
          transitionsInput={transitionsInput}
          startState={startState}
          currentState={currentState}
        />

        <div className="form-grid">
          <div>
            <label className="field-label" htmlFor="dfa-states">
              States
            </label>
            <input
              id="dfa-states"
              className="text-input"
              type="text"
              value={statesInput}
              onChange={(event) => setField('statesInput', event.target.value)}
              placeholder="q0, q1, q2"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="dfa-start">
              Start state
            </label>
            <input
              id="dfa-start"
              className="text-input"
              type="text"
              value={startState}
              onChange={(event) => setField('startState', event.target.value)}
              placeholder="q0"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="dfa-accept">
            Accept states
          </label>
          <input
            id="dfa-accept"
            className="text-input"
            type="text"
            value={acceptStatesInput}
            onChange={(event) => setField('acceptStatesInput', event.target.value)}
            placeholder="q0, q2"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="dfa-transitions">
            Transitions
          </label>
          <textarea
            id="dfa-transitions"
            className="text-area"
            value={transitionsInput}
            onChange={(event) => setField('transitionsInput', event.target.value)}
            placeholder={'q0,0=q1\nq0,1=q0'}
            rows={6}
          />
          <p className="helper-text">One transition per line using `from,symbol=to`.</p>
        </div>

        <label className="field-label" htmlFor="dfa-input">
          Input string
        </label>
        <input
          id="dfa-input"
          className="text-input"
          type="text"
          value={input}
          onChange={(event) => setField('input', event.target.value)}
          placeholder="Enter a binary string like 1010"
        />

        <div className="button-row">
          <button className="primary-button" type="button" onClick={initializeSimulation}>
            Initialize
          </button>
          <button className="secondary-button" type="button" onClick={stepSimulation}>
            Next Step
          </button>
          <button className="secondary-button" type="button" onClick={simulate}>
            Run All
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
            <span className="result-label">Current state</span>
            <strong>{currentState ?? 'Not started'}</strong>
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
              : 'Initialize the simulation to start stepping through the string.'}
          </small>
        </div>

        <div className="history-panel">
          <span className="result-label">Step trace</span>
          <div className="history-list">
            {history.length > 0 ? (
              history.map((entry) => (
                <div className="history-item" key={`${entry.step}-${entry.state}`}>
                  <strong>Step {entry.step}</strong>
                  <span>State: {entry.state}</span>
                  <span>Symbol: {entry.symbol ?? 'start'}</span>
                  <span>{entry.detail}</span>
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

export default DfaSimulatorPage
