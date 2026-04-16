import { Link } from 'react-router-dom'
import PdaGraph from '../components/PdaGraph'
import { usePdaStore } from '../store/pdaStore'

function PdaSimulatorPage() {
  const statesInput = usePdaStore((state) => state.statesInput)
  const alphabetInput = usePdaStore((state) => state.alphabetInput)
  const stackAlphabetInput = usePdaStore((state) => state.stackAlphabetInput)
  const startState = usePdaStore((state) => state.startState)
  const acceptStatesInput = usePdaStore((state) => state.acceptStatesInput)
  const initialStackSymbol = usePdaStore((state) => state.initialStackSymbol)
  const acceptanceMode = usePdaStore((state) => state.acceptanceMode)
  const transitionsInput = usePdaStore((state) => state.transitionsInput)
  const input = usePdaStore((state) => state.input)
  const result = usePdaStore((state) => state.result)
  const machineError = usePdaStore((state) => state.machineError)
  const currentState = usePdaStore((state) => state.currentState)
  const currentIndex = usePdaStore((state) => state.currentIndex)
  const currentSymbol = usePdaStore((state) => state.currentSymbol)
  const stack = usePdaStore((state) => state.stack)
  const history = usePdaStore((state) => state.history)
  const started = usePdaStore((state) => state.started)
  const activeEdgeKeys = usePdaStore((state) => state.activeEdgeKeys)
  const lastStackAction = usePdaStore((state) => state.lastStackAction)
  const stackActionType = usePdaStore((state) => state.stackActionType)
  const setField = usePdaStore((state) => state.setField)
  const simulate = usePdaStore((state) => state.simulate)
  const stepSimulation = usePdaStore((state) => state.stepSimulation)
  const resetSimulation = usePdaStore((state) => state.resetSimulation)
  const initializeSimulation = usePdaStore((state) => state.initializeSimulation)

  const processedInput = input.slice(0, currentIndex)
  const remainingInput = input.slice(currentIndex)
  const displayStack = [...stack].reverse()

  return (
    <section className="page-card simulator-card">
      <div className="page-copy">
        <p className="eyebrow">PDA Simulator</p>
        <h1>Trace stack-driven computation one step at a time.</h1>
        <p className="lead">
          Define a pushdown automaton, inspect the live stack, and step through
          transitions with push, pop, and replace operations.
        </p>
      </div>

      <div className="simulator-panel">
        <PdaGraph
          statesInput={statesInput}
          acceptStatesInput={acceptStatesInput}
          transitionsInput={transitionsInput}
          startState={startState}
          currentState={currentState}
          activeEdgeKeys={activeEdgeKeys}
        />

        <div className="stack-panel">
          <div className="stack-panel-header">
            <span className="result-label">Stack View</span>
            <small className="helper-text">Top of stack is shown first.</small>
          </div>

          <div className="stack-visual">
            {displayStack.length > 0 ? (
              displayStack.map((symbol, index) => (
                <div
                  className={`stack-cell ${index === 0 ? 'is-top is-${stackActionType}' : ''}`}
                  key={`${symbol}-${index}`}
                >
                  {symbol}
                </div>
              ))
            ) : (
              <div className={`stack-empty ${stackActionType === 'pop' ? 'is-pop' : ''}`}>Empty stack</div>
            )}
          </div>

          <div className="stack-summary">
            <span className="result-label">Last stack action</span>
            <strong>{lastStackAction ?? 'Not started'}</strong>
          </div>
        </div>

        <div className="form-grid triple-grid">
          <div>
            <label className="field-label" htmlFor="pda-states">
              States
            </label>
            <input
              id="pda-states"
              className="text-input"
              type="text"
              value={statesInput}
              onChange={(event) => setField('statesInput', event.target.value)}
              placeholder="q0, q1"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="pda-alphabet">
              Alphabet
            </label>
            <input
              id="pda-alphabet"
              className="text-input"
              type="text"
              value={alphabetInput}
              onChange={(event) => setField('alphabetInput', event.target.value)}
              placeholder="0, 1"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="pda-stack-alphabet">
              Stack alphabet
            </label>
            <input
              id="pda-stack-alphabet"
              className="text-input"
              type="text"
              value={stackAlphabetInput}
              onChange={(event) => setField('stackAlphabetInput', event.target.value)}
              placeholder="Z, A"
            />
          </div>
        </div>

        <div className="form-grid">
          <div>
            <label className="field-label" htmlFor="pda-start">
              Start state
            </label>
            <input
              id="pda-start"
              className="text-input"
              type="text"
              value={startState}
              onChange={(event) => setField('startState', event.target.value)}
              placeholder="q0"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="pda-accept">
              Accept states
            </label>
            <input
              id="pda-accept"
              className="text-input"
              type="text"
              value={acceptStatesInput}
              onChange={(event) => setField('acceptStatesInput', event.target.value)}
              placeholder="q1"
            />
          </div>
        </div>

        <div className="form-grid">
          <div>
            <label className="field-label" htmlFor="pda-stack-initial">
              Initial stack symbol
            </label>
            <input
              id="pda-stack-initial"
              className="text-input"
              type="text"
              value={initialStackSymbol}
              onChange={(event) => setField('initialStackSymbol', event.target.value)}
              placeholder="Z"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="pda-acceptance-mode">
              Acceptance mode
            </label>
            <select
              id="pda-acceptance-mode"
              className="text-input"
              value={acceptanceMode}
              onChange={(event) => setField('acceptanceMode', event.target.value)}
            >
              <option value="final-state">Final state</option>
              <option value="empty-stack">Empty stack</option>
              <option value="either">Either</option>
            </select>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="pda-transitions">
            Transitions
          </label>
          <textarea
            id="pda-transitions"
            className="text-area"
            value={transitionsInput}
            onChange={(event) => setField('transitionsInput', event.target.value)}
            placeholder={'q0,0,Z = q0,AZ\nq0,1,A = q1,eps'}
            rows={7}
          />
          <p className="helper-text">
            Use `from,input,stackTop = to,stackOperation`. `eps` is supported
            for epsilon input or pop operations.
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor="pda-input">
            Input string
          </label>
          <input
            id="pda-input"
            className="text-input"
            type="text"
            value={input}
            onChange={(event) => setField('input', event.target.value)}
            placeholder="Enter a string like 0011"
          />
        </div>

        <div className="button-row">
          <button className="primary-button" type="button" onClick={initializeSimulation}>
            Initialize
          </button>
          <button className="secondary-button" type="button" onClick={simulate}>
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

        <div className="status-grid pda-status-grid">
          <div className="result-box">
            <span className="result-label">Current state</span>
            <strong>{currentState ?? 'Not started'}</strong>
          </div>

          <div className="result-box">
            <span className="result-label">Current input symbol</span>
            <strong>{started ? currentSymbol ?? 'eps / end' : 'Not started'}</strong>
          </div>

          <div className="result-box">
            <span className="result-label">Stack content</span>
            <strong>{stack.length > 0 ? stack.join(', ') : 'Empty'}</strong>
          </div>

          <div className={`result-box ${result ? result.toLowerCase() : ''}`}>
            <span className="result-label">Result</span>
            <strong>{result ?? 'In progress / waiting'}</strong>
          </div>
        </div>

        <div className="result-box">
          <span className="result-label">Input panel</span>
          <div className="input-track">
            <span className="processed">{processedInput || '\u00A0'}</span>
            <span className="remaining">{remainingInput || '\u00A0'}</span>
          </div>
          <small className="helper-text">
            {started
              ? `Processed ${currentIndex} of ${input.length} input symbols.`
              : 'Initialize the PDA to load the start state and initial stack symbol.'}
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
                  <span>Input: {entry.symbol ?? 'start / eps'}</span>
                  <span>Stack: {entry.stack.length > 0 ? entry.stack.join(', ') : 'Empty'}</span>
                  {entry.transition ? <span>Transition: {entry.transition}</span> : null}
                  <span>{entry.stackAction}</span>
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

export default PdaSimulatorPage
