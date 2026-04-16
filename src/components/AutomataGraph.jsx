const NODE_RADIUS = 38
const NODE_DIAMETER = NODE_RADIUS * 2
const HORIZONTAL_GAP = 280
const VERTICAL_GAP = 165
const PADDING_X = 130
const PADDING_Y = 90

const parseList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const parseTransitionLines = (transitionsInput) =>
  transitionsInput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const normalized = line.replace('->', '=')
      const [left, right] = normalized.split('=').map((part) => part?.trim())
      const [fromState, symbol] = left?.split(',').map((part) => part?.trim()) ?? []
      const toStates = right?.split(',').map((part) => part?.trim()).filter(Boolean) ?? []

      if (!fromState || !symbol || toStates.length === 0) {
        return []
      }

      return toStates.map((toState) => ({ fromState, symbol, toState }))
    })

const getCanvasSize = (states) => {
  const columns = Math.max(1, Math.min(states.length, 4))
  const rows = Math.max(1, Math.ceil(states.length / columns))

  return {
    width: PADDING_X * 2 + Math.max(0, columns - 1) * HORIZONTAL_GAP + NODE_DIAMETER,
    height: PADDING_Y * 2 + Math.max(0, rows - 1) * VERTICAL_GAP + NODE_DIAMETER,
  }
}

const getNodePositions = (states) => {
  const { width } = getCanvasSize(states)
  const columns = Math.max(1, Math.min(states.length, 4))

  return states.reduce((positions, state, index) => {
    const row = Math.floor(index / columns)
    const column = index % columns
    const itemsInRow = Math.min(columns, states.length - row * columns)
    const rowWidth = (itemsInRow - 1) * HORIZONTAL_GAP
    const rowStartX = width / 2 - rowWidth / 2

    positions[state] = {
      x: rowStartX + column * HORIZONTAL_GAP,
      y: PADDING_Y + row * VERTICAL_GAP,
    }

    return positions
  }, {})
}

const getLineEndpoint = (from, to) => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy) || 1
  const offsetX = (dx / distance) * NODE_RADIUS
  const offsetY = (dy / distance) * NODE_RADIUS

  return {
    startX: from.x + offsetX,
    startY: from.y + offsetY,
    endX: to.x - offsetX,
    endY: to.y - offsetY,
    midX: (from.x + to.x) / 2,
    midY: (from.y + to.y) / 2,
    normalX: -dy / distance,
    normalY: dx / distance,
  }
}

const getPairCurveNormal = (from, to) => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy) || 1

  return {
    x: -dy / distance,
    y: dx / distance,
  }
}

const buildEdges = (transitions, states) =>
  Object.values(
    transitions
      .filter(({ fromState, toState }) => states.includes(fromState) && states.includes(toState))
      .reduce((acc, transition) => {
        const key = `${transition.fromState}->${transition.toState}`

        if (!acc[key]) {
          acc[key] = {
            id: key,
            fromState: transition.fromState,
            toState: transition.toState,
            symbols: [],
          }
        }

        acc[key].symbols.push(transition.symbol)
        return acc
      }, {}),
  ).map((edge) => ({
    ...edge,
    label: edge.symbols.join(', '),
  }))

const getPairKey = (fromState, toState) => [fromState, toState].sort().join('::')

function AutomataGraph({
  statesInput,
  acceptStatesInput,
  transitionsInput,
  startState,
  activeStates = [],
  activeEdgeKeys = [],
  graphEdges = null,
  helperText = 'Static automata diagram with active-state highlighting.',
}) {
  const states = parseList(statesInput)
  const acceptStates = new Set(parseList(acceptStatesInput))
  const positions = getNodePositions(states)
  const transitions = graphEdges ? [] : parseTransitionLines(transitionsInput)
  const edges = graphEdges ?? buildEdges(transitions, states)
  const pairCounts = edges.reduce((acc, edge) => {
    const pairKey = getPairKey(edge.fromState, edge.toState)
    acc[pairKey] = (acc[pairKey] ?? 0) + 1
    return acc
  }, {})
  const activeStateSet = new Set(activeStates)
  const activeEdgeSet = new Set(activeEdgeKeys)
  const { width, height } = getCanvasSize(states)
  const trimmedStartState = startState.trim()
  const startNode = positions[trimmedStartState]

  return (
    <div className="graph-card">
      <div className="graph-header">
        <span className="result-label">Graph View</span>
        <small className="helper-text">{helperText}</small>
      </div>

      <div className="graph-canvas simple-graph-canvas">
        {states.length > 0 ? (
          <svg
            className="dfa-svg"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Automata graph"
          >
            <defs>
              <marker
                id="dfa-arrowhead"
                markerWidth="5"
                markerHeight="5"
                refX="4.2"
                refY="2.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L5,2.5 L0,5 Z" className="dfa-arrowhead" />
              </marker>
            </defs>

            {startNode ? (
              <g className="dfa-start-arrow">
                <line
                  x1={startNode.x - 95}
                  y1={startNode.y}
                  x2={startNode.x - NODE_RADIUS - 10}
                  y2={startNode.y}
                  markerEnd="url(#dfa-arrowhead)"
                  strokeWidth="1"
                />
                <text x={startNode.x - 104} y={startNode.y - 12}>
                  Start
                </text>
              </g>
            ) : null}

            {edges.map((edge) => {
              const from = positions[edge.fromState]
              const to = positions[edge.toState]

              if (!from || !to) {
                return null
              }

              if (edge.fromState === edge.toState) {
                const loopY = from.y - NODE_RADIUS - 20
                const labelX = from.x
                const labelY = loopY - 6

                return (
                  <g className="dfa-edge-group" key={edge.id}>
                    <path
                      className={`dfa-edge-line ${activeEdgeSet.has(edge.id) ? 'is-active-branch' : ''}`}
                      d={`M ${from.x - 18} ${from.y - NODE_RADIUS + 5}
                        C ${from.x - 48} ${loopY},
                          ${from.x + 48} ${loopY},
                          ${from.x + 18} ${from.y - NODE_RADIUS + 5}`}
                      markerEnd="url(#dfa-arrowhead)"
                      strokeWidth="1"
                    />
                    <text className="dfa-edge-label dfa-loop-label" x={labelX} y={labelY}>
                      {edge.label}
                    </text>
                  </g>
                )
              }

              const { startX, startY, endX, endY, midX, midY, normalX, normalY } =
                getLineEndpoint(from, to)
              const pairKey = getPairKey(edge.fromState, edge.toState)
              const isBidirectional = pairCounts[pairKey] > 1
              const pairStart = edge.fromState < edge.toState ? from : to
              const pairEnd = edge.fromState < edge.toState ? to : from
              const pairNormal = getPairCurveNormal(pairStart, pairEnd)
              const curveDirection = isBidirectional
                ? edge.fromState < edge.toState
                  ? 1
                  : -1
                : 0
              const curveStrength = isBidirectional ? 58 : 0
              const offsetX = isBidirectional
                ? pairNormal.x * curveStrength * curveDirection
                : normalX * curveStrength
              const offsetY = isBidirectional
                ? pairNormal.y * curveStrength * curveDirection
                : normalY * curveStrength
              const controlX = midX + offsetX
              const controlY = midY + offsetY
              const labelOffset = isBidirectional ? 40 * curveDirection : -5
              const labelX = isBidirectional
                ? midX + pairNormal.x * labelOffset
                : midX + normalX * labelOffset
              const labelY = isBidirectional
                ? midY + pairNormal.y * labelOffset
                : midY + normalY * labelOffset

              return (
                <g className="dfa-edge-group" key={edge.id}>
                  <path
                    className={`dfa-edge-line ${activeEdgeSet.has(edge.id) ? 'is-active-branch' : ''}`}
                    d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
                    markerEnd="url(#dfa-arrowhead)"
                    strokeWidth="1"
                  />
                  <text className="dfa-edge-label" x={labelX} y={labelY} fontWeight="700">
                    {edge.label}
                  </text>
                </g>
              )
            })}

            {states.map((state) => {
              const position = positions[state]
              const isAccept = acceptStates.has(state)
              const isActive = activeStateSet.has(state)

              return (
                <g className="dfa-node-group" key={state}>
                  {isActive ? (
                    <circle className="dfa-node-halo" cx={position.x} cy={position.y} r={NODE_RADIUS + 8} />
                  ) : null}
                  <circle
                    className={`dfa-node-circle ${isAccept ? 'is-accepting' : ''} ${isActive ? 'is-active' : ''}`}
                    cx={position.x}
                    cy={position.y}
                    r={NODE_RADIUS}
                  />
                  {isAccept ? (
                    <circle
                      className={`dfa-node-inner-ring ${isActive ? 'is-active' : ''}`}
                      cx={position.x}
                      cy={position.y}
                      r={NODE_RADIUS - 7}
                    />
                  ) : null}
                  <text className="dfa-node-label" x={position.x} y={position.y}>
                    {state}
                  </text>
                </g>
              )
            })}
          </svg>
        ) : (
          <div className="empty-graph">Add states to render the automata diagram.</div>
        )}
      </div>
    </div>
  )
}

export default AutomataGraph
