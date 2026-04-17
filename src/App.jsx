import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DfaSimulatorPage from './pages/DfaSimulatorPage'
import NfaSimulatorPage from './pages/NfaSimulatorPage'
import PdaSimulatorPage from './pages/PdaSimulatorPage'
import RegexToDfaPage from './pages/RegexToDfaPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <Link className="brand" to="/">
            TOC Visual Lab
          </Link>
          <nav className="app-nav">
            <Link to="/">Home Page</Link>
            <Link to="/dfa">DFA Simulator</Link>
            <Link to="/nfa">NFA Simulator</Link>
            <Link to="/pda">PDA Simulator</Link>
            <Link to="/regex-dfa">Regex to DFA</Link>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dfa" element={<DfaSimulatorPage />} />
            <Route path="/nfa" element={<NfaSimulatorPage />} />
            <Route path="/pda" element={<PdaSimulatorPage />} />
            <Route path="/regex-dfa" element={<RegexToDfaPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
