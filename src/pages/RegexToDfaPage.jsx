import { Link } from 'react-router-dom'
import DfaGraph from '../components/DfaGraph'
import { useRegexDfaStore } from '../store/regexDfaStore'

const examples = ['a*', 'ab', 'a|b', '(a|b)*']

function RegexToDfaPage() {
  const regex = useRegexDfaStore((state) => state.regex)
  const machineError = useRegexDfaStore((state) => state.machineError)
  const statesInput = useRegexDfaStore((state) => state.statesInput)
  const startState = useRegexDfaStore((state) => state.startState)
  const acceptStatesInput = useRegexDfaStore((state) => state.acceptStatesInput)
  const transitionsInput = useRegexDfaStore((state) => state.transitionsInput)
  const postfix = useRegexDfaStore((state) => state.postfix)
  const converted = useRegexDfaStore((state) => state.converted)
  const setField = useRegexDfaStore((state) => state.setField)
  const convert = useRegexDfaStore((state) => state.convert)
  const reset = useRegexDfaStore((state) => state.reset)

  return (
    <section className="page-card simulator-card">
      <div className="page-copy">
        <p className="eyebrow">Regex to DFA</p>
        <h1>Convert regular expressions into deterministic automata.</h1>
        <p className="lead">
          Enter a small regex, run Thompson plus subset construction, and inspect
          the resulting DFA graph.
        </p>
      </div>

      <div className="simulator-panel">
        <DfaGraph
          statesInput={statesInput}
          acceptStatesInput={acceptStatesInput}
          transitionsInput={transitionsInput}
          startState={startState}
          currentState={null}
        />

        <div>
          <label className="field-label" htmlFor="regex-input">
            Regular expression
          </label>
          <input
            id="regex-input"
            className="text-input"
            type="text"
            value={regex}
            onChange={(event) => setField('regex', event.target.value)}
            placeholder="Enter regex like (a|b)*"
          />
          <p className="helper-text">
            Supported: symbols like `a`, `b`, union `|`, concatenation, `*`, and parentheses.
          </p>
        </div>

        <div className="button-row">
          <button className="primary-button" type="button" onClick={convert}>
            Convert
          </button>
          <button className="secondary-button" type="button" onClick={reset}>
            Reset
          </button>
        </div>

        <div className="example-row">
          {examples.map((example) => (
            <button
              className="example-chip"
              key={example}
              type="button"
              onClick={() => setField('regex', example)}
            >
              {example}
            </button>
          ))}
        </div>

        {machineError ? (
          <div className="error-box">
            <span className="result-label">Conversion error</span>
            <strong>{machineError}</strong>
          </div>
        ) : null}

        <div className="status-grid">
          <div className="result-box">
            <span className="result-label">Postfix form</span>
            <strong>{postfix || 'Not converted yet'}</strong>
          </div>

          <div className="result-box">
            <span className="result-label">DFA states</span>
            <strong>{converted ? statesInput : 'Not converted yet'}</strong>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="regex-dfa-transitions">
            Generated DFA transitions
          </label>
          <textarea
            id="regex-dfa-transitions"
            className="text-area"
            value={transitionsInput}
            readOnly
            placeholder="Converted transitions will appear here."
            rows={6}
          />
        </div>
      </div>

      <Link className="secondary-link" to="/">
        Back to Home
      </Link>
    </section>
  )
}

export default RegexToDfaPage
