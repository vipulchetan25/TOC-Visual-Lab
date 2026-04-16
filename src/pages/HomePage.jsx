import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <section className="page-card hero-card">
      <p className="eyebrow">Theory of Computation</p>
      <h1>Build and test automata visually.</h1>
      <p className="lead">
        Build, simulate, and inspect deterministic and nondeterministic
        automata with a shared visual workspace.
      </p>
      <div className="hero-actions">
        <Link className="primary-button hero-button" to="/dfa">
          Open DFA Simulator
        </Link>
        <Link className="primary-button hero-button" to="/nfa">
          Open NFA Simulator
        </Link>
        <Link className="primary-button hero-button" to="/pda">
          Open PDA Simulator
        </Link>
        <Link className="primary-button hero-button" to="/regex-dfa">
          Open Regex to DFA
        </Link>
      </div>
    </section>
  )
}

export default HomePage
